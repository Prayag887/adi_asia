use std::{env, net::IpAddr, net::SocketAddr, path::PathBuf};

use anyhow::{Context, Result};

#[derive(Clone, Debug)]
pub struct R2Config {
    pub endpoint: String,
    pub bucket: String,
    pub access_key_id: String,
    pub secret_access_key: String,
    pub public_url: String,
}

#[derive(Clone, Debug)]
pub struct Config {
    /// Control database (tenants, domains, billing, logins).
    pub database_url: String,
    /// One SQLite file per tenant lives here: `{tenant_db_dir}/{slug}.db`.
    pub tenant_db_dir: PathBuf,
    /// Public listener: Caddy proxies `/api/*`, `/admin/*` and unmatched hosts here.
    pub listen: SocketAddr,
    /// Internal listener (Caddy `ask` endpoint). Never expose publicly.
    pub internal_listen: SocketAddr,
    /// Hostname of the owner console, e.g. `admin.folio.example`.
    pub admin_host: String,
    /// Every tenant gets `{slug}.{base_domain}` automatically.
    pub base_domain: String,
    /// `{sites_dir}/tenants/{slug}` holds static builds, `{sites_dir}/hosts/{host}` are symlinks.
    pub sites_dir: PathBuf,
    /// Used when R2 is not configured; Caddy serves it at `/uploads/*`.
    pub uploads_dir: PathBuf,
    /// Public IPs of this VPS. Domain verification checks DNS resolves here. Empty = skip check.
    pub server_ips: Vec<IpAddr>,
    pub health_scheme: String,
    pub health_interval_secs: u64,
    pub secure_cookies: bool,
    pub r2: Option<R2Config>,
}

fn var(name: &str, default: &str) -> String {
    env::var(name).unwrap_or_else(|_| default.to_string())
}

impl Config {
    pub fn from_env() -> Result<Self> {
        let server_ips = var("SERVER_IPS", "")
            .split(',')
            .map(str::trim)
            .filter(|s| !s.is_empty())
            .map(|s| s.parse().with_context(|| format!("bad SERVER_IPS entry {s}")))
            .collect::<Result<_>>()?;

        let r2 = match (
            env::var("R2_ENDPOINT"),
            env::var("R2_BUCKET"),
            env::var("R2_ACCESS_KEY_ID"),
            env::var("R2_SECRET_ACCESS_KEY"),
            env::var("R2_PUBLIC_URL"),
        ) {
            (Ok(endpoint), Ok(bucket), Ok(access_key_id), Ok(secret_access_key), Ok(public_url)) => Some(R2Config {
                endpoint,
                bucket,
                access_key_id,
                secret_access_key,
                public_url: public_url.trim_end_matches('/').to_string(),
            }),
            _ => None,
        };

        let database_url = var("DATABASE_URL", "sqlite://data/folio.db");
        Ok(Self {
            tenant_db_dir: env::var("TENANT_DB_DIR").map(PathBuf::from).unwrap_or_else(|_| crate::db::default_tenant_dir(&database_url)),
            database_url,
            listen: var("LISTEN", "127.0.0.1:3000").parse().context("LISTEN")?,
            internal_listen: var("INTERNAL_LISTEN", "127.0.0.1:3001").parse().context("INTERNAL_LISTEN")?,
            admin_host: var("ADMIN_HOST", "admin.localhost").to_lowercase(),
            base_domain: var("BASE_DOMAIN", "localhost").to_lowercase(),
            sites_dir: var("SITES_DIR", "data/sites").into(),
            uploads_dir: var("UPLOADS_DIR", "data/uploads").into(),
            server_ips,
            health_scheme: var("HEALTH_SCHEME", "https"),
            health_interval_secs: var("HEALTH_INTERVAL_SECS", "300").parse().context("HEALTH_INTERVAL_SECS")?,
            secure_cookies: var("SECURE_COOKIES", "true") == "true",
            r2,
        })
    }
}
