use axum::{
    Json,
    http::StatusCode,
    response::{IntoResponse, Response},
};
use serde_json::json;

#[derive(Debug)]
pub enum AppError {
    NotFound,
    Unauthorized,
    Forbidden(&'static str),
    BadRequest(String),
    TooMany,
    Internal(anyhow::Error),
}

pub type AppResult<T> = Result<T, AppError>;

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let (status, message) = match self {
            AppError::NotFound => (StatusCode::NOT_FOUND, "Not found.".to_string()),
            AppError::Unauthorized => (StatusCode::UNAUTHORIZED, "You must be signed in.".to_string()),
            AppError::Forbidden(msg) => (StatusCode::FORBIDDEN, msg.to_string()),
            AppError::BadRequest(msg) => (StatusCode::BAD_REQUEST, msg),
            AppError::TooMany => (StatusCode::TOO_MANY_REQUESTS, "Too many attempts. Try again later.".to_string()),
            AppError::Internal(err) => {
                tracing::error!("{err:#}");
                (StatusCode::INTERNAL_SERVER_ERROR, "Something went wrong.".to_string())
            }
        };
        (status, Json(json!({ "error": message }))).into_response()
    }
}

impl<E: Into<anyhow::Error>> From<E> for AppError {
    fn from(err: E) -> Self {
        AppError::Internal(err.into())
    }
}

pub fn bad(msg: impl Into<String>) -> AppError {
    AppError::BadRequest(msg.into())
}
