use std::{str::FromStr, time::Duration};

use anyhow::Result;
use sqlx::sqlite::{SqliteConnectOptions, SqliteJournalMode, SqlitePool, SqlitePoolOptions, SqliteSynchronous};

pub type Db = SqlitePool;

pub async fn connect(url: &str) -> Result<Db> {
    let options = SqliteConnectOptions::from_str(url)?
        .create_if_missing(true)
        .journal_mode(SqliteJournalMode::Wal)
        .synchronous(SqliteSynchronous::Normal)
        .busy_timeout(Duration::from_secs(5))
        .foreign_keys(true)
        // Page cache per connection, negative = KiB. 4 connections * 4 MB caps cache at ~16 MB.
        .pragma("cache_size", "-4000")
        .pragma("temp_store", "memory");

    let pool = SqlitePoolOptions::new()
        .max_connections(4)
        .min_connections(1)
        .idle_timeout(Duration::from_secs(300))
        .connect_with(options)
        .await?;

    sqlx::migrate!("./migrations").run(&pool).await?;
    Ok(pool)
}
