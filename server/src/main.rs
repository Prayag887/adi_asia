mod admin;
mod api;
mod auth;
mod billing;
mod config;
mod db;
mod error;
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
    let db = db::connect_control(&cfg.database_url).await?;

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
        Some(other) => bail!("unknown command {other}. Commands: serve, create-superadmin"),
    }
}

fn build_state(cfg: Config, db: db::Db) -> Result<AppState> {
    Ok(AppState {
        storage: Arc::new(Storage::from_config(&cfg)?),
        http: reqwest::Client::builder()
            .user_agent("folio-monitor/1.0")
            .connect_timeout(Duration::from_secs(5))
            .pool_max_idle_per_host(1)
            .build()?,
        limiter: Default::default(),
        tenants: Arc::new(db::TenantDbs::new(cfg.tenant_db_dir.clone())),
        cfg: Arc::new(cfg),
        db,
    })
}

/// Public router (sites' `/api`, the admin, alias redirects) and internal router (Caddy ask).
fn routers(state: AppState) -> (Router, Router) {
    let public = Router::new()
        .nest("/api", api::router())
        .nest("/admin", admin::router())
        .fallback(alias_redirect)
        .layer(TraceLayer::new_for_http())
        .with_state(state.clone());
    let internal = Router::new()
        .route("/tls-check", get(tls_check))
        .route("/healthz", get(|| async { "ok" }))
        .with_state(state);
    (public, internal)
}

async fn serve(cfg: Config, db: db::Db) -> Result<()> {
    let state = build_state(cfg, db)?;
    db::move_legacy_tenant_data(&state.db, &state.tenants).await.context("moving tenant data into per-tenant databases")?;
    sites::sync_all(&state.db, &state.cfg).await.context("syncing site links")?;
    monitor::spawn(state.clone());
    let (public, internal) = routers(state.clone());

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

#[cfg(test)]
mod tests {
    //! End-to-end tests through the real routers, with throwaway databases on disk.
    use std::path::PathBuf;

    use axum::{
        body::Body,
        http::{Request, StatusCode, header},
    };
    use http_body_util::BodyExt;
    use tower::ServiceExt;

    use super::*;

    struct Env {
        dir: PathBuf,
        state: AppState,
        app: Router,
    }

    impl Drop for Env {
        fn drop(&mut self) {
            let _ = std::fs::remove_dir_all(&self.dir);
        }
    }

    async fn env() -> Env {
        let dir = std::env::temp_dir().join(format!("folio-test-{}", uuid::Uuid::new_v4()));
        std::fs::create_dir_all(&dir).unwrap();
        let cfg = Config {
            database_url: format!("sqlite://{}/folio.db", dir.display()),
            tenant_db_dir: dir.join("tenants"),
            listen: "127.0.0.1:0".parse().unwrap(),
            internal_listen: "127.0.0.1:0".parse().unwrap(),
            admin_host: "admin.test".into(),
            base_domain: "test".into(),
            sites_dir: dir.join("sites"),
            uploads_dir: dir.join("uploads"),
            server_ips: vec![],
            health_scheme: "http".into(),
            health_interval_secs: 3600,
            secure_cookies: false,
            r2: None,
        };
        let db = db::connect_control(&cfg.database_url).await.unwrap();
        let state = build_state(cfg, db).unwrap();
        let (app, _) = routers(state.clone());
        Env { dir, state, app }
    }

    /// Inserts a tenant with host `<slug>.test` and one editor; returns the tenant id.
    async fn tenant(state: &AppState, slug: &str) -> i64 {
        let id = sqlx::query("INSERT INTO tenants (slug, name) VALUES (?, ?)")
            .bind(slug)
            .bind(slug)
            .execute(&state.db)
            .await
            .unwrap()
            .last_insert_rowid();
        sqlx::query("INSERT INTO domains (host, tenant_id, is_primary, verified) VALUES (?, ?, 1, 1)")
            .bind(format!("{slug}.test"))
            .bind(id)
            .execute(&state.db)
            .await
            .unwrap();
        let hash = auth::hash_password("password-123".into()).await.unwrap();
        sqlx::query("INSERT INTO users (tenant_id, email, password_hash) VALUES (?, ?, ?)")
            .bind(id)
            .bind(format!("editor@{slug}.test"))
            .bind(hash)
            .execute(&state.db)
            .await
            .unwrap();
        id
    }

    async fn call(app: &Router, method: &str, host: &str, path: &str, cookie: Option<&str>, json: Option<&str>) -> (StatusCode, String, Option<String>) {
        let mut req = Request::builder().method(method).uri(path).header(header::HOST, host);
        if let Some(c) = cookie {
            req = req.header(header::COOKIE, c);
        }
        let body = match json {
            Some(j) => {
                req = req.header(header::CONTENT_TYPE, "application/json");
                Body::from(j.to_string())
            }
            None => Body::empty(),
        };
        let res = app.clone().oneshot(req.body(body).unwrap()).await.unwrap();
        let status = res.status();
        let set_cookie = res
            .headers()
            .get(header::SET_COOKIE)
            .and_then(|v| v.to_str().ok())
            .map(|v| v.split(';').next().unwrap().to_string());
        let bytes = res.into_body().collect().await.unwrap().to_bytes();
        (status, String::from_utf8_lossy(&bytes).into_owned(), set_cookie)
    }

    async fn login(app: &Router, slug: &str) -> String {
        let body = format!(r#"{{"email":"editor@{slug}.test","password":"password-123"}}"#);
        let (status, _, cookie) = call(app, "POST", &format!("{slug}.test"), "/api/auth/login", None, Some(&body)).await;
        assert_eq!(status, StatusCode::OK);
        cookie.unwrap()
    }

    async fn count(db: &db::Db, table: &str) -> i64 {
        sqlx::query_as::<_, (i64,)>(&format!("SELECT count(*) FROM {table}")).fetch_one(db).await.unwrap().0
    }

    #[tokio::test]
    async fn each_tenant_gets_its_own_database_file() {
        let e = env().await;
        tenant(&e.state, "alpha").await;
        tenant(&e.state, "beta").await;
        assert_eq!(e.state.tenants.open_count().await, 0, "tenant databases open lazily");

        let cookie = login(&e.app, "alpha").await;
        let (status, _, _) =
            call(&e.app, "POST", "alpha.test", "/api/posts", Some(&cookie), Some(r#"{"title":"Alpha post","body":"Hello"}"#)).await;
        assert_eq!(status, StatusCode::CREATED);
        let (_, _, _) = call(&e.app, "PUT", "alpha.test", "/api/content", Some(&cookie), Some(r#"{"page:h1:0:0":"Alpha"}"#)).await;
        let (_, _, _) = call(&e.app, "POST", "beta.test", "/api/contact", None, Some(r#"{"name":"N","email":"n@x.y","message":"hi"}"#)).await;

        let (_, alpha_posts, _) = call(&e.app, "GET", "alpha.test", "/api/posts", None, None).await;
        let (_, beta_posts, _) = call(&e.app, "GET", "beta.test", "/api/posts", None, None).await;
        assert!(alpha_posts.contains("Alpha post"));
        assert_eq!(beta_posts, "[]");

        // The data really lives in separate files.
        assert!(e.dir.join("tenants/alpha.db").exists() && e.dir.join("tenants/beta.db").exists());
        let alpha = e.state.tenants.get("alpha").await.unwrap();
        let beta = e.state.tenants.get("beta").await.unwrap();
        assert_eq!((count(&alpha, "posts").await, count(&alpha, "site_content").await, count(&alpha, "contact_messages").await), (1, 1, 0));
        assert_eq!((count(&beta, "posts").await, count(&beta, "site_content").await, count(&beta, "contact_messages").await), (0, 0, 1));
        // And not in the control database.
        let leftovers: Option<(String,)> =
            sqlx::query_as("SELECT name FROM sqlite_master WHERE name IN ('posts', 'site_content', 'contact_messages')")
                .fetch_optional(&e.state.db)
                .await
                .unwrap();
        assert!(leftovers.is_none());
    }

    #[tokio::test]
    async fn an_editor_cannot_touch_another_tenant() {
        let e = env().await;
        tenant(&e.state, "alpha").await;
        tenant(&e.state, "beta").await;
        let alpha_cookie = login(&e.app, "alpha").await;
        let (status, _, _) =
            call(&e.app, "POST", "beta.test", "/api/posts", Some(&alpha_cookie), Some(r#"{"title":"x","body":"y"}"#)).await;
        assert_eq!(status, StatusCode::UNAUTHORIZED);
        let (status, _, _) = call(&e.app, "GET", "beta.test", "/api/auth/me", Some(&alpha_cookie), None).await;
        assert_eq!(status, StatusCode::UNAUTHORIZED);
        let (status, _, _) = call(&e.app, "GET", "nobody.test", "/api/posts", None, None).await;
        assert_eq!(status, StatusCode::NOT_FOUND);
    }

    #[tokio::test]
    async fn legacy_shared_tables_move_into_tenant_databases() {
        let e = env().await;
        let a = tenant(&e.state, "alpha").await;
        let b = tenant(&e.state, "beta").await;
        // Control migration 0002 parked the old shared tables as legacy_*. Fill them like
        // a pre-split production database.
        for (t, key) in [(a, "a"), (b, "b")] {
            sqlx::query("INSERT INTO legacy_site_content (tenant_id, key, value) VALUES (?, ?, 'v')").bind(t).bind(key).execute(&e.state.db).await.unwrap();
            sqlx::query("INSERT INTO legacy_posts (id, tenant_id, title, body, published, published_at) VALUES (?, ?, 'T', 'B', 1, '2026-01-01')")
                .bind(format!("post-{key}"))
                .bind(t)
                .execute(&e.state.db)
                .await
                .unwrap();
            sqlx::query("INSERT INTO legacy_section_visibility (tenant_id, section_key, visible) VALUES (?, 'about', 0)").bind(t).execute(&e.state.db).await.unwrap();
            sqlx::query("INSERT INTO legacy_custom_sections (id, tenant_id, title, body, position) VALUES (?, ?, 'C', 'D', 1)")
                .bind(format!("cs-{key}"))
                .bind(t)
                .execute(&e.state.db)
                .await
                .unwrap();
            sqlx::query("INSERT INTO legacy_contact_messages (tenant_id, name, email, message) VALUES (?, 'N', 'n@x.y', 'm')").bind(t).execute(&e.state.db).await.unwrap();
        }

        db::move_legacy_tenant_data(&e.state.db, &e.state.tenants).await.unwrap();
        db::move_legacy_tenant_data(&e.state.db, &e.state.tenants).await.unwrap(); // idempotent

        for slug in ["alpha", "beta"] {
            let t = e.state.tenants.get(slug).await.unwrap();
            for table in ["site_content", "posts", "section_visibility", "custom_sections", "contact_messages"] {
                assert_eq!(count(&t, table).await, 1, "{slug}.{table}");
            }
        }
        let (_, body, _) = call(&e.app, "GET", "alpha.test", "/api/content", None, None).await;
        assert_eq!(body, r#"[{"key":"a","value":"v"}]"#);
        let legacy: Vec<(String,)> = sqlx::query_as("SELECT name FROM sqlite_master WHERE name LIKE 'legacy_%'").fetch_all(&e.state.db).await.unwrap();
        assert!(legacy.is_empty(), "legacy tables dropped: {legacy:?}");
    }

    #[tokio::test]
    async fn deleting_a_tenant_archives_its_database() {
        let e = env().await;
        tenant(&e.state, "alpha").await;
        e.state.tenants.get("alpha").await.unwrap();
        e.state.tenants.archive("alpha").await.unwrap();
        assert!(!e.dir.join("tenants/alpha.db").exists());
        let archived = std::fs::read_dir(e.dir.join("tenants/deleted")).unwrap().count();
        assert!(archived >= 1);
        assert!(e.state.tenants.get("../etc").await.is_err(), "slugs are validated before touching the filesystem");
    }
}
