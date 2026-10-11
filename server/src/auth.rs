use argon2::{
    Argon2,
    password_hash::{PasswordHash, PasswordHasher, PasswordVerifier, SaltString},
};
use axum::{
    extract::FromRequestParts,
    http::{HeaderMap, header, request::Parts},
    response::{IntoResponse, Redirect, Response},
};
use chrono::{Duration, Utc};
use rand::RngCore;
use sha2::{Digest, Sha256};

use crate::{
    db::Db,
    error::{AppError, AppResult},
    state::AppState,
    tenant::{Tenant, request_host},
};

pub const SITE_COOKIE: &str = "folio_session";
pub const ADMIN_COOKIE: &str = "folio_admin";
const SITE_SESSION_DAYS: i64 = 30;
const ADMIN_SESSION_DAYS: i64 = 7;

pub async fn hash_password(password: String) -> AppResult<String> {
    if password.chars().count() < 10 {
        return Err(AppError::BadRequest("Passwords must be at least 10 characters.".into()));
    }
    // Argon2 allocates ~19 MB per hash; keep it off the async workers.
    tokio::task::spawn_blocking(move || {
        let salt = SaltString::generate(&mut rand::rngs::OsRng);
        Argon2::default()
            .hash_password(password.as_bytes(), &salt)
            .map(|h| h.to_string())
            .map_err(|e| anyhow::anyhow!("hash: {e}"))
    })
    .await?
    .map_err(AppError::Internal)
}

pub async fn verify_password(password: String, hash: String) -> bool {
    tokio::task::spawn_blocking(move || {
        PasswordHash::new(&hash)
            .map(|parsed| Argon2::default().verify_password(password.as_bytes(), &parsed).is_ok())
            .unwrap_or(false)
    })
    .await
    .unwrap_or(false)
}

fn token_hash(token: &str) -> String {
    hex::encode(Sha256::digest(token.as_bytes()))
}

pub fn cookie_value<'a>(headers: &'a HeaderMap, name: &str) -> Option<&'a str> {
    headers
        .get_all(header::COOKIE)
        .iter()
        .filter_map(|v| v.to_str().ok())
        .flat_map(|v| v.split(';'))
        .filter_map(|pair| pair.trim().split_once('='))
        .find(|(k, _)| *k == name)
        .map(|(_, v)| v)
}

/// Creates a session row and returns the `Set-Cookie` header value.
pub async fn start_session(state: &AppState, user_id: i64, admin: bool) -> AppResult<String> {
    let mut bytes = [0u8; 32];
    rand::thread_rng().fill_bytes(&mut bytes);
    let token = hex::encode(bytes);
    let days = if admin { ADMIN_SESSION_DAYS } else { SITE_SESSION_DAYS };
    let expires = (Utc::now() + Duration::days(days)).to_rfc3339();
    sqlx::query("INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)")
        .bind(token_hash(&token))
        .bind(user_id)
        .bind(expires)
        .execute(&state.db)
        .await?;
    Ok(session_cookie(state, admin, &token, days * 86_400))
}

pub async fn end_session(state: &AppState, headers: &HeaderMap, admin: bool) -> AppResult<String> {
    let name = if admin { ADMIN_COOKIE } else { SITE_COOKIE };
    if let Some(token) = cookie_value(headers, name) {
        sqlx::query("DELETE FROM sessions WHERE token_hash = ?")
            .bind(token_hash(token))
            .execute(&state.db)
            .await?;
    }
    Ok(session_cookie(state, admin, "", 0))
}

fn session_cookie(state: &AppState, admin: bool, token: &str, max_age: i64) -> String {
    let (name, path, same_site) = if admin { (ADMIN_COOKIE, "/admin", "Strict") } else { (SITE_COOKIE, "/", "Lax") };
    let secure = if state.cfg.secure_cookies { "; Secure" } else { "" };
    format!("{name}={token}; Path={path}; Max-Age={max_age}; HttpOnly; SameSite={same_site}{secure}")
}

pub async fn delete_expired_sessions(db: &Db) -> anyhow::Result<()> {
    sqlx::query("DELETE FROM sessions WHERE expires_at < ?")
        .bind(Utc::now().to_rfc3339())
        .execute(db)
        .await?;
    Ok(())
}

#[derive(sqlx::FromRow)]
struct SessionUser {
    id: i64,
    tenant_id: Option<i64>,
    email: String,
    is_super: bool,
}

async fn session_user(state: &AppState, headers: &HeaderMap, cookie: &str) -> AppResult<Option<SessionUser>> {
    let Some(token) = cookie_value(headers, cookie) else { return Ok(None) };
    Ok(sqlx::query_as(
        "SELECT u.id, u.tenant_id, u.email, u.is_super FROM sessions s JOIN users u ON u.id = s.user_id
         WHERE s.token_hash = ? AND s.expires_at > ?",
    )
    .bind(token_hash(token))
    .bind(Utc::now().to_rfc3339())
    .fetch_optional(&state.db)
    .await?)
}

/// A signed-in editor of the tenant that owns the current Host.
pub struct Editor {
    pub user_id: i64,
    pub email: String,
    pub tenant: Tenant,
}

impl FromRequestParts<AppState> for Editor {
    type Rejection = AppError;

    async fn from_request_parts(parts: &mut Parts, state: &AppState) -> Result<Self, Self::Rejection> {
        let tenant = Tenant::from_request_parts(parts, state).await?;
        let user = session_user(state, &parts.headers, SITE_COOKIE).await?.ok_or(AppError::Unauthorized)?;
        if user.tenant_id != Some(tenant.id) {
            return Err(AppError::Unauthorized);
        }
        Ok(Editor { user_id: user.id, email: user.email, tenant })
    }
}

/// Platform owner signed in on the admin host.
pub struct SuperAdmin {
    pub email: String,
}

pub enum AdminRejection {
    NotFound,
    Login,
    Error(AppError),
}

impl IntoResponse for AdminRejection {
    fn into_response(self) -> Response {
        match self {
            AdminRejection::NotFound => AppError::NotFound.into_response(),
            AdminRejection::Login => Redirect::to("/admin/login").into_response(),
            AdminRejection::Error(e) => e.into_response(),
        }
    }
}

impl FromRequestParts<AppState> for SuperAdmin {
    type Rejection = AdminRejection;

    async fn from_request_parts(parts: &mut Parts, state: &AppState) -> Result<Self, Self::Rejection> {
        require_admin_host(parts, state)?;
        match session_user(state, &parts.headers, ADMIN_COOKIE).await {
            Ok(Some(user)) if user.is_super => Ok(SuperAdmin { email: user.email }),
            Ok(_) => Err(AdminRejection::Login),
            Err(e) => Err(AdminRejection::Error(e)),
        }
    }
}

/// The admin console only answers on `ADMIN_HOST`, never on tenant domains.
pub struct AdminHost;

impl FromRequestParts<AppState> for AdminHost {
    type Rejection = AdminRejection;

    async fn from_request_parts(parts: &mut Parts, state: &AppState) -> Result<Self, Self::Rejection> {
        require_admin_host(parts, state)?;
        Ok(AdminHost)
    }
}

fn require_admin_host(parts: &Parts, state: &AppState) -> Result<(), AdminRejection> {
    match request_host(parts) {
        Some(host) if host == state.cfg.admin_host => Ok(()),
        _ => Err(AdminRejection::NotFound),
    }
}
