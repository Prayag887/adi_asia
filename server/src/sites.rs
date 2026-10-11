//! Static-site wiring for Caddy.
//!
//! ```text
//! {sites_dir}/tenants/{slug}/        <- CI uploads each tenant's static build here
//! {sites_dir}/hosts/{host} -> ../tenants/{slug}   (primary + verified hosts of active tenants)
//! {sites_dir}/hosts/{host} -> ../_suspended       (suspended tenants)
//! ```
//!
//! Caddy serves `/srv/sites/hosts/{host}` straight from disk. Hosts without a link
//! (unverified, or non-primary aliases) fall through to Axum, which redirects aliases.

use std::{io::ErrorKind, net::IpAddr, path::Path};

use anyhow::Result;

use crate::{config::Config, db::Db};

const SUSPENDED_PAGE: &str = r#"<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Site unavailable</title><style>body{font-family:system-ui,sans-serif;display:grid;place-items:center;min-height:100vh;margin:0;background:#f6f6f4;color:#333}</style></head><body><p>This site is temporarily unavailable.</p></body></html>"#;

#[derive(sqlx::FromRow)]
struct LinkRow {
    host: String,
    slug: String,
    status: String,
}

/// Rebuilds every host symlink from the database. Cheap; called after any domain or
/// tenant-status change and at startup.
pub async fn sync_all(db: &Db, cfg: &Config) -> Result<()> {
    let rows: Vec<LinkRow> = sqlx::query_as(
        "SELECT d.host, t.slug, t.status FROM domains d JOIN tenants t ON t.id = d.tenant_id
         WHERE d.verified = 1 AND d.is_primary = 1",
    )
    .fetch_all(db)
    .await?;

    let hosts_dir = cfg.sites_dir.join("hosts");
    let suspended_dir = cfg.sites_dir.join("_suspended");
    tokio::fs::create_dir_all(&hosts_dir).await?;
    tokio::fs::create_dir_all(cfg.sites_dir.join("tenants")).await?;
    tokio::fs::create_dir_all(&suspended_dir).await?;
    tokio::fs::write(suspended_dir.join("index.html"), SUSPENDED_PAGE).await?;

    let wanted: std::collections::HashMap<String, String> = rows
        .into_iter()
        .map(|r| {
            let target = if r.status == "active" { format!("../tenants/{}", r.slug) } else { "../_suspended".to_string() };
            (r.host, target)
        })
        .collect();

    // Make sure every linked tenant has a build directory, even before the first deploy.
    for slug in wanted.values().filter_map(|t| t.strip_prefix("../tenants/")) {
        tokio::fs::create_dir_all(cfg.sites_dir.join("tenants").join(slug)).await?;
    }

    let mut entries = tokio::fs::read_dir(&hosts_dir).await?;
    while let Some(entry) = entries.next_entry().await? {
        let name = entry.file_name().to_string_lossy().to_string();
        let current = tokio::fs::read_link(entry.path()).await.ok();
        match wanted.get(&name) {
            Some(target) if current.as_deref() == Some(Path::new(target)) => {}
            _ => remove_link(&entry.path()).await?,
        }
    }
    for (host, target) in &wanted {
        let link = hosts_dir.join(host);
        if tokio::fs::symlink_metadata(&link).await.is_err() {
            tokio::fs::symlink(target, &link).await?;
        }
    }
    Ok(())
}

async fn remove_link(path: &Path) -> Result<()> {
    match tokio::fs::remove_file(path).await {
        Ok(()) => Ok(()),
        Err(e) if e.kind() == ErrorKind::NotFound => Ok(()),
        Err(e) => Err(e.into()),
    }
}

/// Resolves `host` and reports whether it points at this server.
pub async fn dns_points_here(cfg: &Config, host: &str) -> Result<(bool, Vec<IpAddr>)> {
    let resolved: Vec<IpAddr> = match tokio::net::lookup_host((host, 443)).await {
        Ok(addrs) => addrs.map(|a| a.ip()).collect(),
        Err(_) => Vec::new(),
    };
    if cfg.server_ips.is_empty() {
        // Development: no server IPs configured, accept anything.
        return Ok((true, resolved));
    }
    let ok = !resolved.is_empty() && resolved.iter().any(|ip| cfg.server_ips.contains(ip));
    Ok((ok, resolved))
}
