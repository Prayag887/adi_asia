mod admin;
mod api;
mod auth;
mod billing;
mod config;
mod db;
mod error;
mod import;
mod monitor;
mod sites;
mod state;
mod storage;
mod tenant;

use std::{collections::HashMap, sync::Arc, time::Duration};

use anyhow::{Context, Result, bail};
use axum::{
    Router,
    extract::{Query, Request, State},
    http::StatusCode,
    response::{IntoResponse, Redirect, Response},
    routing::get,
};
use tower_http::trace::TraceLayer;
use tracing_subscriber::EnvFilter;

use crate::{config::Config, state::AppState, storage::Storage, tenant::normalize_host};

// Two workers are plenty for ~20 low-traffic sites and keep per-thread memory low.
#[tokio::main(flavor = "multi_thread", worker_threads = 2)]
async fn main() -> Result<()> {
    tracing_subscriber::fmt()
        .with_env_filter(EnvFilter::try_from_default_env().unwrap_or_else(|_| "folio=info,tower_http=warn".into()))
        .init();

    let cfg = Config::from_env()?;
    if let Some(dir) = cfg.database_url.strip_prefix("sqlite://").and_then(|p| std::path::Path::new(p).parent())
        && !dir.as_os_str().is_empty() {
            std::fs::create_dir_all(dir).with_context(|| format!("creating {}", dir.display()))?;
        }
    let db = db::connect(&cfg.database_url).await?;

    let args: Vec<String> = std::env::args().skip(1).collect();
    match args.first().map(String::as_str) {
        None | Some("serve") => serve(cfg, db).await,
        Some("create-superadmin") => {
            let email = args.get(1).context("usage: folio create-superadmin <email>  (password from FOLIO_PASSWORD)")?;
            let password = std::env::var("FOLIO_PASSWORD").context("set FOLIO_PASSWORD")?;
            let hash = auth::hash_password(password).await.map_err(|e| anyhow::anyhow!("{e:?}"))?;
            sqlx::query(
                "INSERT INTO users (tenant_id, email, password_hash, is_super) VALUES (NULL, ?, ?, 1)
                 ON CONFLICT DO UPDATE SET password_hash = excluded.password_hash",
            )
            .bind(email.trim().to_lowercase())
            .bind(hash)
            .execute(&db)
            .await?;
            println!("superadmin {email} ready");
            Ok(())
        }
        Some("import-supabase") => {
            let slug = args.get(1).context("usage: folio import-supabase <tenant-slug>  (SUPABASE_URL, SUPABASE_ANON_KEY)")?;
            import::supabase(&db, slug).await
        }
        Some(other) => bail!("unknown command {other}. Commands: serve, create-superadmin, import-supabase"),
    }
}

async fn serve(cfg: Config, db: db::Db) -> Result<()> {
    let state = AppState {
        storage: Arc::new(Storage::from_config(&cfg)?),
        http: reqwest::Client::builder()
            .user_agent("folio-monitor/1.0")
            .connect_timeout(Duration::from_secs(5))
            .pool_max_idle_per_host(1)
            .build()?,
        limiter: Default::default(),
        cfg: Arc::new(cfg),
        db,
    };
    sites::sync_all(&state.db, &state.cfg).await.context("syncing site links")?;
    monitor::spawn(state.clone());

    let public = Router::new()
        .nest("/api", api::router())
        .nest("/admin", admin::router())
        .fallback(alias_redirect)
        .layer(TraceLayer::new_for_http())
        .with_state(state.clone());

    let internal = Router::new()
        .route("/tls-check", get(tls_check))
        .route("/healthz", get(|| async { "ok" }))
        .with_state(state.clone());

    let public_listener = tokio::net::TcpListener::bind(state.cfg.listen).await?;
    let internal_listener = tokio::net::TcpListener::bind(state.cfg.internal_listen).await?;
    tracing::info!(
        "listening on {} (internal {}), admin at https://{}/admin, images: {}",
        state.cfg.listen,
        state.cfg.internal_listen,
        state.cfg.admin_host,
        state.storage.name()
    );

    let internal_task = tokio::spawn(async move { axum::serve(internal_listener, internal).await });
    axum::serve(public_listener, public).with_graceful_shutdown(shutdown()).await?;
    internal_task.abort();
    Ok(())
}

async fn shutdown() {
    let _ = tokio::signal::ctrl_c().await;
}

/// Caddy on-demand TLS `ask`: 200 only for hosts we serve, so nobody can make us
/// request certificates for arbitrary domains.
async fn tls_check(State(state): State<AppState>, Query(q): Query<HashMap<String, String>>) -> StatusCode {
    let Some(host) = q.get("domain").and_then(|d| normalize_host(d)) else { return StatusCode::BAD_REQUEST };
    if host == state.cfg.admin_host {
        return StatusCode::OK;
    }
    let known: Result<Option<(i64,)>, _> =
        sqlx::query_as("SELECT 1 FROM domains WHERE host = ? AND verified = 1").bind(&host).fetch_optional(&state.db).await;
    match known {
        Ok(Some(_)) => StatusCode::OK,
        _ => StatusCode::NOT_FOUND,
    }
}

/// Requests Caddy could not serve from disk land here. Verified non-primary hosts
/// (e.g. `client.com` when `www.client.com` is primary) get a permanent redirect.
async fn alias_redirect(State(state): State<AppState>, req: Request) -> Response {
    let host = req
        .headers()
        .get(axum::http::header::HOST)
        .and_then(|h| h.to_str().ok())
        .and_then(normalize_host);
    let Some(host) = host else { return StatusCode::NOT_FOUND.into_response() };
    if host == state.cfg.admin_host {
        return Redirect::to("/admin").into_response();
    }
    let primary: Option<(String,)> = sqlx::query_as(
        "SELECT p.host FROM domains d JOIN domains p ON p.tenant_id = d.tenant_id AND p.is_primary = 1 AND p.verified = 1
         WHERE d.host = ? AND d.verified = 1 AND d.is_primary = 0",
    )
    .bind(&host)
    .fetch_optional(&state.db)
    .await
    .unwrap_or(None);
    match primary {
        Some((primary,)) => {
            let path = req.uri().path_and_query().map(|p| p.as_str()).unwrap_or("/");
            Redirect::permanent(&format!("https://{primary}{path}")).into_response()
        }
        None => (StatusCode::NOT_FOUND, "Not found").into_response(),
    }
}
