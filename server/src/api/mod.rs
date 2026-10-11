//! JSON API used by tenant sites. The tenant comes from the Host header. Content queries
//! run against that tenant's own SQLite file (`state.tenant_db`), so a site can only ever
//! reach its own data. Logins and sessions live in the control database.

use std::{collections::HashMap, time::Duration};

use axum::{
    Json, Router,
    extract::{DefaultBodyLimit, Multipart, Path, State},
    http::{HeaderMap, StatusCode, header},
    response::{IntoResponse, Response},
    routing::{delete, get, post, put},
};
use chrono::Utc;
use serde::{Deserialize, Serialize};
use serde_json::json;

use crate::{
    auth::{self, Editor},
    error::{AppError, AppResult, bad},
    state::AppState,
    storage::detect_image,
    tenant::Tenant,
};

const MAX_IMAGE_BYTES: usize = 5 * 1024 * 1024;

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/auth/login", post(login))
        .route("/auth/logout", post(logout))
        .route("/auth/me", get(me))
        .route("/content", get(get_content).put(save_content))
        .route("/posts", get(list_posts).post(create_post))
        .route("/posts/{id}", delete(delete_post).patch(update_post))
        .route("/sections", get(list_sections))
        .route("/sections/{key}", put(set_section))
        .route("/custom-sections", get(list_custom_sections).post(create_custom_section))
        .route("/custom-sections/{id}", delete(delete_custom_section))
        .route("/contact", post(contact))
        .route(
            "/uploads",
            post(upload_image).layer(DefaultBodyLimit::max(MAX_IMAGE_BYTES + 64 * 1024)),
        )
        .layer(DefaultBodyLimit::max(256 * 1024))
}

// ---------- auth ----------

#[derive(Deserialize)]
struct LoginInput {
    email: String,
    password: String,
}

#[derive(sqlx::FromRow)]
struct LoginUser {
    id: i64,
    password_hash: String,
}

async fn login(State(state): State<AppState>, tenant: Tenant, Json(input): Json<LoginInput>) -> AppResult<Response> {
    let email = input.email.trim().to_lowercase();
    if !state.limiter.allow(&format!("login:{}:{email}", tenant.id), 8, Duration::from_secs(900)) {
        return Err(AppError::TooMany);
    }
    let user: Option<LoginUser> =
        sqlx::query_as("SELECT id, password_hash FROM users WHERE tenant_id = ? AND email = ?")
            .bind(tenant.id)
            .bind(&email)
            .fetch_optional(&state.db)
            .await?;
    let Some(user) = user else {
        return Err(bad("That email or password was not accepted."));
    };
    if !auth::verify_password(input.password, user.password_hash).await {
        return Err(bad("That email or password was not accepted."));
    }
    let cookie = auth::start_session(&state, user.id, false).await?;
    Ok(([(header::SET_COOKIE, cookie)], Json(json!({ "email": email }))).into_response())
}

async fn logout(State(state): State<AppState>, headers: HeaderMap) -> AppResult<Response> {
    let cookie = auth::end_session(&state, &headers, false).await?;
    Ok(([(header::SET_COOKIE, cookie)], StatusCode::NO_CONTENT).into_response())
}

async fn me(editor: Editor) -> Json<serde_json::Value> {
    Json(json!({ "email": editor.email }))
}

// ---------- site content ----------

#[derive(Serialize, sqlx::FromRow)]
struct ContentRow {
    key: String,
    value: String,
}

async fn get_content(State(state): State<AppState>, tenant: Tenant) -> AppResult<Json<Vec<ContentRow>>> {
    let rows = sqlx::query_as("SELECT key, value FROM site_content ORDER BY key")
        .fetch_all(&state.tenant_db(&tenant).await?)
        .await?;
    Ok(Json(rows))
}

async fn save_content(
    State(state): State<AppState>,
    editor: Editor,
    Json(changes): Json<HashMap<String, String>>,
) -> AppResult<StatusCode> {
    if changes.len() > 500 || changes.iter().any(|(k, v)| k.len() > 200 || v.len() > 20_000) {
        return Err(bad("Content is too large."));
    }
    let mut tx = state.tenant_db(&editor.tenant).await?.begin().await?;
    for (key, value) in changes {
        sqlx::query("INSERT INTO site_content (key, value) VALUES (?, ?) ON CONFLICT (key) DO UPDATE SET value = excluded.value")
        .bind(key)
        .bind(value)
        .execute(&mut *tx)
        .await?;
    }
    tx.commit().await?;
    Ok(StatusCode::NO_CONTENT)
}

// ---------- posts ----------

#[derive(Serialize, sqlx::FromRow)]
#[serde(rename_all = "camelCase")]
struct PostOut {
    id: String,
    title: String,
    excerpt: String,
    body: String,
    published_at: Option<String>,
    #[sqlx(rename = "cover_url")]
    cover: Option<String>,
}

async fn list_posts(State(state): State<AppState>, tenant: Tenant) -> AppResult<Json<Vec<PostOut>>> {
    let rows = sqlx::query_as(
        "SELECT id, title, excerpt, body, published_at, cover_url FROM posts
         WHERE published = 1 ORDER BY published_at DESC",
    )
    .fetch_all(&state.tenant_db(&tenant).await?)
    .await?;
    Ok(Json(rows))
}

fn excerpt_of(body: &str) -> String {
    body.chars().take(180).collect()
}

fn validate_post(title: &str, body: &str) -> AppResult<()> {
    if title.trim().is_empty() || title.chars().count() > 300 {
        return Err(bad("Titles must be between 1 and 300 characters."));
    }
    if body.len() > 200_000 {
        return Err(bad("The post is too long."));
    }
    Ok(())
}

/// Only accept cover URLs this platform could have produced.
fn validate_cover(state: &AppState, cover: &str) -> AppResult<()> {
    let ok = cover.is_empty()
        || cover.starts_with("/uploads/")
        || state.cfg.r2.as_ref().is_some_and(|r2| cover.starts_with(&format!("{}/", r2.public_url)));
    if ok { Ok(()) } else { Err(bad("Unsupported cover image URL.")) }
}

#[derive(Deserialize)]
struct NewPost {
    title: String,
    body: String,
    excerpt: Option<String>,
    cover: Option<String>,
}

async fn create_post(State(state): State<AppState>, editor: Editor, Json(input): Json<NewPost>) -> AppResult<StatusCode> {
    validate_post(&input.title, &input.body)?;
    let cover = input.cover.filter(|c| !c.is_empty());
    if let Some(cover) = &cover {
        validate_cover(&state, cover)?;
    }
    let excerpt = input.excerpt.map(|e| excerpt_of(&e)).unwrap_or_else(|| excerpt_of(&input.body));
    sqlx::query(
        "INSERT INTO posts (id, title, excerpt, body, published, published_at, author_id, cover_url)
         VALUES (?, ?, ?, ?, 1, ?, ?, ?)",
    )
    .bind(uuid::Uuid::new_v4().to_string())
    .bind(input.title.trim())
    .bind(excerpt)
    .bind(&input.body)
    .bind(Utc::now().to_rfc3339())
    .bind(editor.user_id)
    .bind(cover)
    .execute(&state.tenant_db(&editor.tenant).await?)
    .await?;
    Ok(StatusCode::CREATED)
}

#[derive(Deserialize)]
struct PostPatch {
    title: Option<String>,
    body: Option<String>,
    excerpt: Option<String>,
    cover: Option<String>,
}

async fn update_post(
    State(state): State<AppState>,
    editor: Editor,
    Path(id): Path<String>,
    Json(input): Json<PostPatch>,
) -> AppResult<StatusCode> {
    let mut tx = state.tenant_db(&editor.tenant).await?.begin().await?;
    let (title, body): (String, String) = sqlx::query_as("SELECT title, body FROM posts WHERE id = ?")
        .bind(&id)
        .fetch_optional(&mut *tx)
        .await?
        .ok_or(AppError::NotFound)?;
    validate_post(input.title.as_deref().unwrap_or(&title), input.body.as_deref().unwrap_or(&body))?;
    if let Some(title) = &input.title {
        sqlx::query("UPDATE posts SET title = ? WHERE id = ?").bind(title.trim()).bind(&id).execute(&mut *tx).await?;
    }
    if let Some(body) = &input.body {
        let excerpt = input.excerpt.filter(|e| !e.is_empty()).map(|e| excerpt_of(&e)).unwrap_or_else(|| excerpt_of(body));
        sqlx::query("UPDATE posts SET body = ?, excerpt = ? WHERE id = ?")
            .bind(body)
            .bind(excerpt)
            .bind(&id)
            .execute(&mut *tx)
            .await?;
    }
    if let Some(cover) = &input.cover {
        validate_cover(&state, cover)?;
        sqlx::query("UPDATE posts SET cover_url = ? WHERE id = ?")
            .bind(Some(cover).filter(|c| !c.is_empty()))
            .bind(&id)
            .execute(&mut *tx)
            .await?;
    }
    tx.commit().await?;
    Ok(StatusCode::NO_CONTENT)
}

async fn delete_post(State(state): State<AppState>, editor: Editor, Path(id): Path<String>) -> AppResult<StatusCode> {
    let result = sqlx::query("DELETE FROM posts WHERE id = ?")
        .bind(id)
        .execute(&state.tenant_db(&editor.tenant).await?)
        .await?;
    if result.rows_affected() == 0 {
        return Err(AppError::NotFound);
    }
    Ok(StatusCode::NO_CONTENT)
}

async fn upload_image(State(state): State<AppState>, editor: Editor, mut form: Multipart) -> AppResult<Json<serde_json::Value>> {
    while let Some(field) = form.next_field().await.map_err(|e| bad(e.body_text()))? {
        if field.name() != Some("image") {
            continue;
        }
        let data = field.bytes().await.map_err(|_| bad("Images must be 5 MB or smaller."))?;
        if data.len() > MAX_IMAGE_BYTES {
            return Err(bad("Images must be 5 MB or smaller."));
        }
        let (content_type, ext) = detect_image(&data).ok_or_else(|| bad("Use a JPG, PNG, or WebP image."))?;
        let key = format!(
            "{}/blog-images/{}/{}.{ext}",
            editor.tenant.slug,
            Utc::now().format("%Y-%m-%d"),
            uuid::Uuid::new_v4()
        );
        let url = state.storage.put(&state.http, &key, content_type, data.to_vec()).await?;
        return Ok(Json(json!({ "url": url })));
    }
    Err(bad("An image is required."))
}

// ---------- sections ----------

#[derive(Serialize, sqlx::FromRow)]
struct SectionRow {
    section_key: String,
    visible: bool,
}

async fn list_sections(State(state): State<AppState>, tenant: Tenant) -> AppResult<Json<Vec<SectionRow>>> {
    let rows = sqlx::query_as("SELECT section_key, visible FROM section_visibility")
        .fetch_all(&state.tenant_db(&tenant).await?)
        .await?;
    Ok(Json(rows))
}

#[derive(Deserialize)]
struct Visibility {
    visible: bool,
}

async fn set_section(
    State(state): State<AppState>,
    editor: Editor,
    Path(key): Path<String>,
    Json(input): Json<Visibility>,
) -> AppResult<StatusCode> {
    if key.is_empty() || key.len() > 64 {
        return Err(bad("Invalid section."));
    }
    sqlx::query(
        "INSERT INTO section_visibility (section_key, visible) VALUES (?, ?)
         ON CONFLICT (section_key) DO UPDATE SET visible = excluded.visible",
    )
    .bind(key)
    .bind(input.visible)
    .execute(&state.tenant_db(&editor.tenant).await?)
    .await?;
    Ok(StatusCode::NO_CONTENT)
}

#[derive(Serialize, sqlx::FromRow)]
struct CustomSection {
    id: String,
    title: String,
    body: String,
    position: i64,
}

async fn list_custom_sections(State(state): State<AppState>, tenant: Tenant) -> AppResult<Json<Vec<CustomSection>>> {
    let rows = sqlx::query_as("SELECT id, title, body, position FROM custom_sections ORDER BY position")
        .fetch_all(&state.tenant_db(&tenant).await?)
        .await?;
    Ok(Json(rows))
}

#[derive(Deserialize)]
struct NewCustomSection {
    title: String,
    body: String,
    position: i64,
}

async fn create_custom_section(
    State(state): State<AppState>,
    editor: Editor,
    Json(input): Json<NewCustomSection>,
) -> AppResult<StatusCode> {
    if input.title.trim().is_empty() || input.title.chars().count() > 160 || input.body.len() > 50_000 {
        return Err(bad("Section titles must be 1–160 characters."));
    }
    sqlx::query("INSERT INTO custom_sections (id, title, body, position) VALUES (?, ?, ?, ?)")
        .bind(uuid::Uuid::new_v4().to_string())
        .bind(input.title.trim())
        .bind(input.body)
        .bind(input.position)
        .execute(&state.tenant_db(&editor.tenant).await?)
        .await?;
    Ok(StatusCode::CREATED)
}

async fn delete_custom_section(State(state): State<AppState>, editor: Editor, Path(id): Path<String>) -> AppResult<StatusCode> {
    sqlx::query("DELETE FROM custom_sections WHERE id = ?")
        .bind(id)
        .execute(&state.tenant_db(&editor.tenant).await?)
        .await?;
    Ok(StatusCode::NO_CONTENT)
}

// ---------- contact form ----------

#[derive(Deserialize)]
struct ContactInput {
    name: String,
    email: String,
    #[serde(default)]
    subject: String,
    message: String,
}

async fn contact(State(state): State<AppState>, tenant: Tenant, Json(input): Json<ContactInput>) -> AppResult<StatusCode> {
    if input.name.trim().is_empty() || !input.email.contains('@') || input.message.trim().is_empty() {
        return Err(bad("Name, email and message are required."));
    }
    if input.name.len() > 200 || input.email.len() > 254 || input.subject.len() > 300 || input.message.len() > 10_000 {
        return Err(bad("Message is too long."));
    }
    if !state.limiter.allow(&format!("contact:{}", tenant.id), 30, Duration::from_secs(3600)) {
        return Err(AppError::TooMany);
    }
    sqlx::query("INSERT INTO contact_messages (name, email, subject, message) VALUES (?, ?, ?, ?)")
        .bind(input.name.trim())
        .bind(input.email.trim())
        .bind(input.subject.trim())
        .bind(input.message.trim())
        .execute(&state.tenant_db(&tenant).await?)
        .await?;
    Ok(StatusCode::CREATED)
}
