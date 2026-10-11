//! Background jobs: uptime checks every few minutes, domain-expiry lookups (RDAP)
//! and housekeeping once an hour.

use std::time::{Duration, Instant};

use anyhow::{Context, Result, bail};
use chrono::Utc;
use serde::Deserialize;
use tokio::task::JoinSet;

use crate::{auth, state::AppState};

const CHECK_CONCURRENCY: usize = 8;
const HISTORY_DAYS: i64 = 30;

pub fn spawn(state: AppState) {
    let health = state.clone();
    tokio::spawn(async move {
        let mut tick = tokio::time::interval(Duration::from_secs(health.cfg.health_interval_secs.max(30)));
        loop {
            tick.tick().await;
            if let Err(e) = run_health_checks(&health).await {
                tracing::warn!("health checks: {e:#}");
            }
        }
    });

    tokio::spawn(async move {
        let mut tick = tokio::time::interval(Duration::from_secs(3600));
        loop {
            tick.tick().await;
            if let Err(e) = housekeeping(&state).await {
                tracing::warn!("housekeeping: {e:#}");
            }
        }
    });
}

async fn housekeeping(state: &AppState) -> Result<()> {
    auth::delete_expired_sessions(&state.db).await?;
    let cutoff = (Utc::now() - chrono::Duration::days(HISTORY_DAYS)).to_rfc3339();
    sqlx::query("DELETE FROM health_checks WHERE checked_at < ?").bind(cutoff).execute(&state.db).await?;

    // Registries rate-limit RDAP; once a week per domain is plenty.
    let week_ago = (Utc::now() - chrono::Duration::days(7)).to_rfc3339();
    let stale: Vec<(String,)> = sqlx::query_as(
        "SELECT domain FROM registrations WHERE rdap_checked_at IS NULL OR rdap_checked_at < ?",
    )
    .bind(week_ago)
    .fetch_all(&state.db)
    .await?;
    for (domain,) in stale {
        refresh_registration(state, &domain).await?;
        tokio::time::sleep(Duration::from_secs(2)).await;
    }
    Ok(())
}

pub async fn run_health_checks(state: &AppState) -> Result<()> {
    let hosts: Vec<(String,)> = sqlx::query_as(
        "SELECT d.host FROM domains d JOIN tenants t ON t.id = d.tenant_id
         WHERE d.verified = 1 AND t.status = 'active'",
    )
    .fetch_all(&state.db)
    .await?;

    let mut set = JoinSet::new();
    let mut results = Vec::with_capacity(hosts.len());
    for (host,) in hosts {
        if set.len() >= CHECK_CONCURRENCY
            && let Some(Ok(r)) = set.join_next().await {
                results.push(r);
            }
        let http = state.http.clone();
        let url = format!("{}://{host}/", state.cfg.health_scheme);
        set.spawn(async move { (host, check(&http, &url).await) });
    }
    while let Some(r) = set.join_next().await {
        if let Ok(r) = r {
            results.push(r);
        }
    }

    let now = Utc::now().to_rfc3339();
    let mut tx = state.db.begin().await?;
    for (host, result) in results {
        let (ok, status, latency, error) = match result {
            Ok((status, latency)) => (status < 400, Some(status as i64), Some(latency), None),
            Err(e) => (false, None, None, Some(format!("{e:#}"))),
        };
        sqlx::query(
            "INSERT INTO health_checks (host, checked_at, ok, status_code, latency_ms, error) VALUES (?, ?, ?, ?, ?, ?)",
        )
        .bind(host)
        .bind(&now)
        .bind(ok)
        .bind(status)
        .bind(latency)
        .bind(error)
        .execute(&mut *tx)
        .await?;
    }
    tx.commit().await?;
    Ok(())
}

async fn check(http: &reqwest::Client, url: &str) -> Result<(u16, i64)> {
    let started = Instant::now();
    let response = http.get(url).timeout(Duration::from_secs(10)).send().await?;
    Ok((response.status().as_u16(), started.elapsed().as_millis() as i64))
}

// ---------- RDAP (domain registration expiry) ----------

#[derive(Deserialize)]
struct RdapDomain {
    #[serde(default)]
    events: Vec<RdapEvent>,
    #[serde(default)]
    entities: Vec<RdapEntity>,
}

#[derive(Deserialize)]
struct RdapEvent {
    #[serde(rename = "eventAction")]
    action: String,
    #[serde(rename = "eventDate")]
    date: String,
}

#[derive(Deserialize)]
struct RdapEntity {
    #[serde(default)]
    roles: Vec<String>,
    #[serde(rename = "vcardArray")]
    vcard: Option<serde_json::Value>,
}

pub struct RdapInfo {
    pub expires_at: Option<String>,
    pub registrar: Option<String>,
}

pub async fn rdap_lookup(http: &reqwest::Client, domain: &str) -> Result<RdapInfo> {
    // rdap.org redirects to the authoritative registry server for the TLD.
    let response = http
        .get(format!("https://rdap.org/domain/{domain}"))
        .header("accept", "application/rdap+json")
        .timeout(Duration::from_secs(15))
        .send()
        .await?;
    if !response.status().is_success() {
        bail!("RDAP returned {} (some TLDs, e.g. .np, have no RDAP — enter the date manually)", response.status());
    }
    let data: RdapDomain = response.json().await.context("RDAP response")?;
    let expires_at = data
        .events
        .iter()
        .find(|e| e.action == "expiration")
        .and_then(|e| e.date.get(..10))
        .map(str::to_string);
    let registrar = data
        .entities
        .iter()
        .find(|e| e.roles.iter().any(|r| r == "registrar"))
        .and_then(|e| e.vcard.as_ref())
        .and_then(|v| v.get(1)?.as_array()?.iter().find(|f| f.get(0).and_then(|n| n.as_str()) == Some("fn"))?.get(3)?.as_str().map(str::to_string));
    Ok(RdapInfo { expires_at, registrar })
}

/// Looks up a registration via RDAP and stores the result (or the error).
pub async fn refresh_registration(state: &AppState, domain: &str) -> Result<Option<String>> {
    let now = Utc::now().to_rfc3339();
    match rdap_lookup(&state.http, domain).await {
        Ok(info) => {
            sqlx::query(
                "UPDATE registrations SET expires_at = coalesce(?, expires_at),
                    registrar = CASE WHEN registrar = '' THEN coalesce(?, '') ELSE registrar END,
                    rdap_checked_at = ?, rdap_error = NULL
                 WHERE domain = ?",
            )
            .bind(&info.expires_at)
            .bind(&info.registrar)
            .bind(&now)
            .bind(domain)
            .execute(&state.db)
            .await?;
            Ok(None)
        }
        Err(e) => {
            let msg = format!("{e:#}");
            sqlx::query("UPDATE registrations SET rdap_checked_at = ?, rdap_error = ? WHERE domain = ?")
                .bind(&now)
                .bind(&msg)
                .bind(domain)
                .execute(&state.db)
                .await?;
            Ok(Some(msg))
        }
    }
}
