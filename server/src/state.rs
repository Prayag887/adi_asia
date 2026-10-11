use std::{
    collections::HashMap,
    sync::{Arc, Mutex},
    time::{Duration, Instant},
};

use crate::{config::Config, db::Db, storage::Storage};

#[derive(Clone)]
pub struct AppState {
    pub db: Db,
    pub cfg: Arc<Config>,
    pub http: reqwest::Client,
    pub storage: Arc<Storage>,
    pub limiter: Arc<RateLimiter>,
}

/// Fixed-window counter kept in memory. Good enough for login and contact-form abuse
/// on a single process; resets on restart.
#[derive(Default)]
pub struct RateLimiter {
    hits: Mutex<HashMap<String, (u32, Instant)>>,
}

impl RateLimiter {
    pub fn allow(&self, key: &str, max: u32, window: Duration) -> bool {
        let mut hits = self.hits.lock().unwrap();
        let now = Instant::now();
        if hits.len() > 10_000 {
            hits.retain(|_, (_, start)| now.duration_since(*start) < window);
        }
        let entry = hits.entry(key.to_string()).or_insert((0, now));
        if now.duration_since(entry.1) >= window {
            *entry = (0, now);
        }
        entry.0 += 1;
        entry.0 <= max
    }
}
