use axum::{extract::FromRequestParts, http::request::Parts};

use crate::{
    error::AppError,
    state::AppState,
};

/// Lowercase host without port. Rejects anything that is not a plain DNS name so it is
/// safe to use as a path segment for the per-host symlinks.
pub fn normalize_host(raw: &str) -> Option<String> {
    let host = raw.trim().trim_end_matches('.').to_ascii_lowercase();
    let host = host.rsplit_once(':').map_or(host.as_str(), |(h, port)| {
        if port.chars().all(|c| c.is_ascii_digit()) { h } else { host.as_str() }
    });
    let valid = !host.is_empty()
        && host.len() <= 253
        && !host.starts_with(['.', '-'])
        && !host.contains("..")
        && host.chars().all(|c| c.is_ascii_alphanumeric() || c == '.' || c == '-');
    valid.then(|| host.to_string())
}

pub fn request_host(parts: &Parts) -> Option<String> {
    parts
        .headers
        .get(axum::http::header::HOST)
        .and_then(|h| h.to_str().ok())
        .and_then(normalize_host)
}

/// The tenant that owns the request's Host header.
#[derive(Clone, Debug, sqlx::FromRow)]
pub struct Tenant {
    pub id: i64,
    pub slug: String,
    pub status: String,
}

impl FromRequestParts<AppState> for Tenant {
    type Rejection = AppError;

    async fn from_request_parts(parts: &mut Parts, state: &AppState) -> Result<Self, Self::Rejection> {
        let host = request_host(parts).ok_or(AppError::NotFound)?;
        let tenant: Tenant = sqlx::query_as(
            "SELECT t.id, t.slug, t.status FROM domains d JOIN tenants t ON t.id = d.tenant_id WHERE d.host = ?",
        )
        .bind(&host)
        .fetch_optional(&state.db)
        .await?
        .ok_or(AppError::NotFound)?;
        if tenant.status != "active" {
            return Err(AppError::Forbidden("This site is currently unavailable."));
        }
        Ok(tenant)
    }
}

#[cfg(test)]
mod tests {
    use super::normalize_host;

    #[test]
    fn normalizes_hosts() {
        assert_eq!(normalize_host("Example.COM:443").as_deref(), Some("example.com"));
        assert_eq!(normalize_host("example.com.").as_deref(), Some("example.com"));
        assert_eq!(normalize_host("../etc"), None);
        assert_eq!(normalize_host("a/b.com"), None);
        assert_eq!(normalize_host(""), None);
    }
}
