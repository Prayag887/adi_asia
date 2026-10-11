//! One-off migration of a site's content out of Supabase (via its public REST API).
//! Editor accounts are not migrated — create them in the admin console.

use anyhow::{Context, Result, bail};
use serde::Deserialize;
use serde_json::Value;

use crate::db::Db;

async fn fetch(http: &reqwest::Client, base: &str, key: &str, table: &str) -> Result<Vec<Value>> {
    let response = http
        .get(format!("{base}/rest/v1/{table}?select=*"))
        .header("apikey", key)
        .header("authorization", format!("Bearer {key}"))
        .send()
        .await?;
    if !response.status().is_success() {
        bail!("{table}: {} {}", response.status(), response.text().await.unwrap_or_default());
    }
    Ok(response.json().await?)
}

#[derive(Deserialize)]
struct Post {
    id: String,
    title: String,
    #[serde(default)]
    excerpt: String,
    body: String,
    published: bool,
    published_at: Option<String>,
    cover_url: Option<String>,
    created_at: Option<String>,
}

pub async fn supabase(db: &Db, slug: &str) -> Result<()> {
    let base = std::env::var("SUPABASE_URL").context("set SUPABASE_URL")?;
    let base = base.trim_end_matches('/').trim_end_matches("/rest/v1");
    let key = std::env::var("SUPABASE_ANON_KEY").context("set SUPABASE_ANON_KEY")?;
    let (tenant_id,): (i64,) = sqlx::query_as("SELECT id FROM tenants WHERE slug = ?")
        .bind(slug)
        .fetch_optional(db)
        .await?
        .with_context(|| format!("tenant '{slug}' not found — create it in the admin first"))?;
    let http = reqwest::Client::new();

    let content = fetch(&http, base, &key, "site_content").await?;
    let posts: Vec<Post> = serde_json::from_value(Value::Array(fetch(&http, base, &key, "posts").await?))?;
    let sections = fetch(&http, base, &key, "section_visibility").await?;
    let custom = fetch(&http, base, &key, "custom_sections").await?;

    let mut tx = db.begin().await?;
    for row in &content {
        sqlx::query(
            "INSERT INTO site_content (tenant_id, key, value) VALUES (?, ?, ?)
             ON CONFLICT (tenant_id, key) DO UPDATE SET value = excluded.value",
        )
        .bind(tenant_id)
        .bind(row["key"].as_str())
        .bind(row["value"].as_str())
        .execute(&mut *tx)
        .await?;
    }
    for p in &posts {
        sqlx::query(
            "INSERT INTO posts (id, tenant_id, title, excerpt, body, published, published_at, cover_url, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, coalesce(?, strftime('%Y-%m-%dT%H:%M:%SZ', 'now')))
             ON CONFLICT (id) DO UPDATE SET title = excluded.title, excerpt = excluded.excerpt, body = excluded.body,
                published = excluded.published, published_at = excluded.published_at, cover_url = excluded.cover_url
             WHERE posts.tenant_id = excluded.tenant_id",
        )
        .bind(&p.id)
        .bind(tenant_id)
        .bind(&p.title)
        .bind(&p.excerpt)
        .bind(&p.body)
        .bind(p.published)
        .bind(&p.published_at)
        .bind(&p.cover_url)
        .bind(&p.created_at)
        .execute(&mut *tx)
        .await?;
    }
    for row in &sections {
        sqlx::query(
            "INSERT INTO section_visibility (tenant_id, section_key, visible) VALUES (?, ?, ?)
             ON CONFLICT (tenant_id, section_key) DO UPDATE SET visible = excluded.visible",
        )
        .bind(tenant_id)
        .bind(row["section_key"].as_str())
        .bind(row["visible"].as_bool().unwrap_or(true))
        .execute(&mut *tx)
        .await?;
    }
    for row in &custom {
        sqlx::query(
            "INSERT INTO custom_sections (id, tenant_id, title, body, position) VALUES (?, ?, ?, ?, ?)
             ON CONFLICT (id) DO NOTHING",
        )
        .bind(row["id"].as_str())
        .bind(tenant_id)
        .bind(row["title"].as_str())
        .bind(row["body"].as_str())
        .bind(row["position"].as_i64().unwrap_or(0))
        .execute(&mut *tx)
        .await?;
    }
    tx.commit().await?;
    println!(
        "imported into '{slug}': {} content keys, {} posts, {} section flags, {} custom sections",
        content.len(),
        posts.len(),
        sections.len(),
        custom.len()
    );
    Ok(())
}
