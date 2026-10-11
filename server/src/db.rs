//! Two kinds of SQLite database:
//!
//! - **control** (`folio.db`): platform data. Tenants, domains, billing, logins, sessions,
//!   health checks. Opened once at startup.
//! - **tenant** (`tenants/<slug>.db`): one file per client with its site content, posts,
//!   sections and contact messages. Opened lazily on first use and closed again when idle,
//!   so idle tenants cost (almost) no memory.

use std::{
    collections::HashMap,
    path::{Path, PathBuf},
    str::FromStr,
    time::Duration,
};

use anyhow::{Context, Result, bail};
use sqlx::sqlite::{SqliteConnectOptions, SqliteJournalMode, SqlitePool, SqlitePoolOptions, SqliteSynchronous};
use tokio::sync::RwLock;

pub type Db = SqlitePool;

fn options(url: &str, cache_kib: u32) -> Result<SqliteConnectOptions> {
    Ok(SqliteConnectOptions::from_str(url)?
        .create_if_missing(true)
        .journal_mode(SqliteJournalMode::Wal)
        .synchronous(SqliteSynchronous::Normal)
        .busy_timeout(Duration::from_secs(5))
        .foreign_keys(true)
        // Page cache per connection (negative = KiB).
        .pragma("cache_size", format!("-{cache_kib}"))
        .pragma("temp_store", "memory"))
}

/// The control database. Up to 4 connections x 4 MB cache.
pub async fn connect_control(url: &str) -> Result<Db> {
    let pool = SqlitePoolOptions::new()
        .max_connections(4)
        .min_connections(1)
        .idle_timeout(Duration::from_secs(300))
        .connect_with(options(url, 4000)?)
        .await?;
    sqlx::migrate!("./migrations/control").run(&pool).await?;
    Ok(pool)
}

/// Registry of per-tenant databases, opened on demand.
pub struct TenantDbs {
    dir: PathBuf,
    pools: RwLock<HashMap<String, Db>>,
}

/// Slugs are validated on creation (lowercase letters/digits), but check again because
/// the slug becomes a file name.
fn valid_slug(slug: &str) -> bool {
    (2..=40).contains(&slug.len()) && slug.chars().all(|c| c.is_ascii_lowercase() || c.is_ascii_digit())
}

impl TenantDbs {
    pub fn new(dir: impl Into<PathBuf>) -> Self {
        Self { dir: dir.into(), pools: RwLock::new(HashMap::new()) }
    }

    pub fn path(&self, slug: &str) -> PathBuf {
        self.dir.join(format!("{slug}.db"))
    }

    /// Returns the tenant's pool, creating the database file and running its migrations
    /// the first time.
    pub async fn get(&self, slug: &str) -> Result<Db> {
        if let Some(pool) = self.pools.read().await.get(slug) {
            return Ok(pool.clone());
        }
        if !valid_slug(slug) {
            bail!("invalid tenant slug {slug:?}");
        }
        let mut pools = self.pools.write().await;
        if let Some(pool) = pools.get(slug) {
            return Ok(pool.clone());
        }
        tokio::fs::create_dir_all(&self.dir).await.with_context(|| format!("creating {}", self.dir.display()))?;
        let url = format!("sqlite://{}", self.path(slug).display());
        // Small and lazy: at most 2 connections x 2 MB cache, none kept open while idle.
        let pool = SqlitePoolOptions::new()
            .max_connections(2)
            .min_connections(0)
            .idle_timeout(Duration::from_secs(60))
            .connect_with(options(&url, 2000)?)
            .await
            .with_context(|| format!("opening tenant database {slug}"))?;
        sqlx::migrate!("./migrations/tenant").run(&pool).await.with_context(|| format!("migrating tenant database {slug}"))?;
        pools.insert(slug.to_string(), pool.clone());
        Ok(pool)
    }

    /// Closes a tenant's database and moves the file to `deleted/` (kept, not destroyed).
    pub async fn archive(&self, slug: &str) -> Result<()> {
        if let Some(pool) = self.pools.write().await.remove(slug) {
            pool.close().await;
        }
        if !valid_slug(slug) {
            return Ok(());
        }
        let deleted = self.dir.join("deleted");
        tokio::fs::create_dir_all(&deleted).await?;
        let stamp = chrono::Utc::now().format("%Y%m%d-%H%M%S");
        for suffix in ["", "-wal", "-shm"] {
            let from = PathBuf::from(format!("{}{suffix}", self.path(slug).display()));
            if tokio::fs::metadata(&from).await.is_ok() {
                tokio::fs::rename(&from, deleted.join(format!("{slug}-{stamp}.db{suffix}"))).await?;
            }
        }
        Ok(())
    }

    /// Number of tenant databases currently open (for diagnostics/tests).
    #[cfg(test)]
    pub async fn open_count(&self) -> usize {
        self.pools.read().await.len()
    }
}

const LEGACY_COPIES: [(&str, &str); 5] = [
    ("site_content", "INSERT OR IGNORE INTO t.site_content (key, value) SELECT key, value FROM legacy_site_content WHERE tenant_id = ?"),
    (
        "posts",
        "INSERT OR IGNORE INTO t.posts (id, title, excerpt, body, published, published_at, author_id, cover_url, created_at)
         SELECT id, title, excerpt, body, published, published_at, author_id, cover_url, created_at FROM legacy_posts WHERE tenant_id = ?",
    ),
    (
        "section_visibility",
        "INSERT OR IGNORE INTO t.section_visibility (section_key, visible) SELECT section_key, visible FROM legacy_section_visibility WHERE tenant_id = ?",
    ),
    (
        "custom_sections",
        "INSERT OR IGNORE INTO t.custom_sections (id, title, body, position, created_at)
         SELECT id, title, body, position, created_at FROM legacy_custom_sections WHERE tenant_id = ?",
    ),
    (
        "contact_messages",
        "INSERT OR IGNORE INTO t.contact_messages (id, name, email, subject, message, created_at)
         SELECT id, name, email, subject, message, created_at FROM legacy_contact_messages WHERE tenant_id = ?",
    ),
];

/// One-time move of content from the old shared tables (`legacy_*`, created by control
/// migration 0002) into each tenant's own database, then drops the old tables.
/// Safe to run on every start: it does nothing once the legacy tables are gone.
pub async fn move_legacy_tenant_data(control: &Db, tenants: &TenantDbs) -> Result<()> {
    let legacy: Option<(String,)> =
        sqlx::query_as("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'legacy_posts'")
            .fetch_optional(control)
            .await?;
    if legacy.is_none() {
        return Ok(());
    }

    let all: Vec<(i64, String)> = sqlx::query_as("SELECT id, slug FROM tenants").fetch_all(control).await?;
    let mut conn = control.acquire().await?;
    for (tenant_id, slug) in &all {
        // Creates the file and its schema.
        tenants.get(slug).await?;
        let path = tenants.path(slug);
        sqlx::query("ATTACH DATABASE ? AS t").bind(path.display().to_string()).execute(&mut *conn).await?;
        let copied: Result<Vec<(&str, u64)>> = async {
            sqlx::query("BEGIN").execute(&mut *conn).await?;
            let mut counts = Vec::new();
            for (table, sql) in LEGACY_COPIES {
                let n = sqlx::query(sql).bind(tenant_id).execute(&mut *conn).await?.rows_affected();
                counts.push((table, n));
            }
            sqlx::query("COMMIT").execute(&mut *conn).await?;
            Ok(counts)
        }
        .await;
        if copied.is_err() {
            let _ = sqlx::query("ROLLBACK").execute(&mut *conn).await;
        }
        sqlx::query("DETACH DATABASE t").execute(&mut *conn).await?;
        let counts = copied.with_context(|| format!("moving data for tenant {slug}"))?;
        tracing::info!(tenant = %slug, ?counts, "moved tenant data into its own database");
    }

    sqlx::query("BEGIN").execute(&mut *conn).await?;
    for table in ["legacy_site_content", "legacy_posts", "legacy_section_visibility", "legacy_custom_sections", "legacy_contact_messages"] {
        sqlx::query(&format!("DROP TABLE IF EXISTS {table}")).execute(&mut *conn).await?;
    }
    sqlx::query("COMMIT").execute(&mut *conn).await?;
    tracing::info!("legacy shared content tables dropped");
    Ok(())
}

/// Directory used for tenant databases when TENANT_DB_DIR is not set: `tenants/` next to
/// the control database file.
pub fn default_tenant_dir(control_url: &str) -> PathBuf {
    let path = control_url.trim_start_matches("sqlite://").trim_start_matches("sqlite:");
    Path::new(path).parent().unwrap_or(Path::new(".")).join("tenants")
}
