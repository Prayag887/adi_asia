use std::{path::PathBuf, time::Duration};

use anyhow::{Context, Result, bail};
use rusty_s3::{Bucket, Credentials, S3Action, UrlStyle};

use crate::config::Config;

/// Where uploaded images go. Cloudflare R2 when configured, local disk otherwise.
#[allow(clippy::large_enum_variant)] // built once, lives in an Arc
pub enum Storage {
    R2 { bucket: Bucket, credentials: Credentials, public_url: String },
    Local { dir: PathBuf },
}

impl Storage {
    pub fn from_config(cfg: &Config) -> Result<Self> {
        Ok(match &cfg.r2 {
            Some(r2) => Storage::R2 {
                bucket: Bucket::new(r2.endpoint.parse().context("R2_ENDPOINT")?, UrlStyle::Path, r2.bucket.clone(), "auto")?,
                credentials: Credentials::new(r2.access_key_id.clone(), r2.secret_access_key.clone()),
                public_url: r2.public_url.clone(),
            },
            None => Storage::Local { dir: cfg.uploads_dir.clone() },
        })
    }

    pub fn name(&self) -> &'static str {
        match self {
            Storage::R2 { .. } => "Cloudflare R2",
            Storage::Local { .. } => "Local disk",
        }
    }

    /// Stores `data` under `key` and returns its public URL.
    pub async fn put(&self, http: &reqwest::Client, key: &str, content_type: &str, data: Vec<u8>) -> Result<String> {
        match self {
            Storage::R2 { bucket, credentials, public_url } => {
                let url = bucket.put_object(Some(credentials), key).sign(Duration::from_secs(300));
                let response = http
                    .put(url)
                    .header("content-type", content_type)
                    .header("cache-control", "public, max-age=31536000, immutable")
                    .body(data)
                    .send()
                    .await?;
                if !response.status().is_success() {
                    bail!("R2 upload failed: {} {}", response.status(), response.text().await.unwrap_or_default());
                }
                Ok(format!("{public_url}/{key}"))
            }
            Storage::Local { dir } => {
                let path = dir.join(key);
                if let Some(parent) = path.parent() {
                    tokio::fs::create_dir_all(parent).await?;
                }
                tokio::fs::write(&path, data).await?;
                Ok(format!("/uploads/{key}"))
            }
        }
    }
}

/// Sniffs the file signature instead of trusting the client's Content-Type.
pub fn detect_image(data: &[u8]) -> Option<(&'static str, &'static str)> {
    match data {
        [0xFF, 0xD8, 0xFF, ..] => Some(("image/jpeg", "jpg")),
        [0x89, b'P', b'N', b'G', ..] => Some(("image/png", "png")),
        [b'R', b'I', b'F', b'F', _, _, _, _, b'W', b'E', b'B', b'P', ..] => Some(("image/webp", "webp")),
        _ => None,
    }
}
