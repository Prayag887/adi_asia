//! Owner console: tenants, domains, health, billing. Server-rendered with Askama;
//! HTMX boosts links/forms so navigation feels instant without a JS framework.

mod views;

use std::{collections::HashMap, time::Duration};

use askama::Template;
use axum::{
    Form, Router,
    extract::{Path, Query, State},
    http::{HeaderMap, StatusCode, header},
    response::{Html, IntoResponse, Redirect, Response},
    routing::{get, post},
};
use chrono::Utc;
use serde::Deserialize;

use crate::{
    auth::{self, AdminHost, SuperAdmin},
    billing::{self, due_status, parse_date, parse_money},
    error::{AppError, AppResult},
    monitor, sites,
    state::AppState,
    tenant::normalize_host,
};
use views::*;

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/", get(dashboard))
        .route("/login", get(login_page).post(login))
        .route("/logout", post(logout))
        .route("/static/{file}", get(static_file))
        .route("/health/run", post(run_checks))
        .route("/tenants/new", get(new_tenant_page))
        .route("/tenants", post(create_tenant))
        .route("/tenants/{id}", get(tenant_page).post(update_tenant))
        .route("/tenants/{id}/delete", post(delete_tenant))
        .route("/tenants/{id}/domains", post(add_domain))
        .route("/tenants/{id}/domains/{host}/verify", post(verify_domain))
        .route("/tenants/{id}/domains/{host}/primary", post(make_primary))
        .route("/tenants/{id}/domains/{host}/delete", post(delete_domain))
        .route("/tenants/{id}/registrations", post(save_registration))
        .route("/tenants/{id}/registrations/{domain}/refresh", post(refresh_registration))
        .route("/tenants/{id}/registrations/{domain}/delete", post(delete_registration))
        .route("/tenants/{id}/payments", post(record_payment))
        .route("/tenants/{id}/payments/{pid}/delete", post(delete_payment))
        .route("/tenants/{id}/users", post(add_user))
        .route("/tenants/{id}/users/{uid}/password", post(reset_password))
        .route("/tenants/{id}/users/{uid}/delete", post(delete_user))
}

fn render(t: impl Template) -> AppResult<Response> {
    Ok(Html(t.render()?).into_response())
}

/// Redirect back to a page with a flash message in the query string.
fn back(path: &str, result: Result<String, String>) -> Response {
    let (key, msg) = match result {
        Ok(m) => ("msg", m),
        Err(e) => ("err", e),
    };
    let sep = if path.contains('?') { '&' } else { '?' };
    Redirect::to(&format!("{path}{sep}{key}={}", url::form_urlencoded::byte_serialize(msg.as_bytes()).collect::<String>()))
        .into_response()
}

fn tenant_path(id: i64) -> String {
    format!("/admin/tenants/{id}")
}

// ---------- auth ----------

async fn login_page(_: AdminHost, Query(flash): Query<Flash>) -> AppResult<Response> {
    render(LoginPage { flash })
}

#[derive(Deserialize)]
struct LoginForm {
    email: String,
    password: String,
}

async fn login(_: AdminHost, State(state): State<AppState>, Form(form): Form<LoginForm>) -> AppResult<Response> {
    let email = form.email.trim().to_lowercase();
    if !state.limiter.allow(&format!("admin-login:{email}"), 5, Duration::from_secs(900)) {
        return Ok(back("/admin/login", Err("Too many attempts. Try again in 15 minutes.".into())));
    }
    let user: Option<(i64, String)> =
        sqlx::query_as("SELECT id, password_hash FROM users WHERE is_super = 1 AND email = ?")
            .bind(&email)
            .fetch_optional(&state.db)
            .await?;
    if let Some((id, hash)) = user
        && auth::verify_password(form.password, hash).await {
            let cookie = auth::start_session(&state, id, true).await?;
            return Ok(([(header::SET_COOKIE, cookie)], Redirect::to("/admin")).into_response());
        }
    Ok(back("/admin/login", Err("That email or password was not accepted.".into())))
}

async fn logout(_: AdminHost, State(state): State<AppState>, headers: HeaderMap) -> AppResult<Response> {
    let cookie = auth::end_session(&state, &headers, true).await?;
    Ok(([(header::SET_COOKIE, cookie)], Redirect::to("/admin/login")).into_response())
}

async fn static_file(_: AdminHost, Path(file): Path<String>) -> Response {
    let (body, content_type) = match file.as_str() {
        "htmx.min.js" => (include_str!("../../static/htmx.min.js"), "text/javascript"),
        "admin.css" => (include_str!("../../static/admin.css"), "text/css"),
        _ => return StatusCode::NOT_FOUND.into_response(),
    };
    ([(header::CONTENT_TYPE, content_type), (header::CACHE_CONTROL, "public, max-age=3600")], body).into_response()
}

// ---------- dashboard ----------

async fn dashboard(admin: SuperAdmin, State(state): State<AppState>, Query(flash): Query<Flash>) -> AppResult<Response> {
    let tenants: Vec<TenantRow> = sqlx::query_as("SELECT * FROM tenants ORDER BY name").fetch_all(&state.db).await?;
    let primaries: HashMap<i64, String> =
        sqlx::query_as::<_, (i64, String)>("SELECT tenant_id, host FROM domains WHERE is_primary = 1 AND verified = 1")
            .fetch_all(&state.db)
            .await?
            .into_iter()
            .collect();
    let health = latest_health(&state).await?;
    let uptime = uptime_24h(&state).await?;
    let nearest: HashMap<i64, (String, Option<String>)> = sqlx::query_as::<_, (i64, String, Option<String>)>(
        "SELECT tenant_id, domain, min(expires_at) FROM registrations WHERE expires_at IS NOT NULL GROUP BY tenant_id",
    )
    .fetch_all(&state.db)
    .await?
    .into_iter()
    .map(|(t, d, e)| (t, (d, e)))
    .collect();

    let mut summary = Summary::default();
    let rows: Vec<DashboardRow> = tenants
        .into_iter()
        .map(|t| {
            let host = primaries.get(&t.id).cloned();
            let check = host.as_ref().and_then(|h| health.get(h));
            let site = SiteHealth::from_check(t.status == "active", host.is_some(), check);
            let pay = if t.price_cents == 0 {
                due_status(None, 14, "Free")
            } else {
                due_status(parse_date(t.paid_until.as_deref()), 14, "Unpaid")
            };
            let (domain, domain_due) = match nearest.get(&t.id) {
                Some((d, e)) => (Some(d.clone()), due_status(parse_date(e.as_deref()), 30, "—")),
                None => (None, due_status(None, 30, "—")),
            };
            summary.total += 1;
            match site.class {
                "good" => summary.up += 1,
                "bad" => summary.down += 1,
                _ => {}
            }
            if pay.class == "bad" || (t.price_cents > 0 && pay.days.is_none()) {
                summary.overdue += 1;
            }
            if domain_due.days.is_some_and(|d| d <= 30) {
                summary.domains_expiring += 1;
            }
            DashboardRow {
                uptime: host.as_ref().and_then(|h| uptime.get(h)).map(|u| format!("{u:.1}%")).unwrap_or_else(|| "—".into()),
                price: billing::money(t.price_cents, &t.currency),
                id: t.id,
                name: t.name,
                slug: t.slug,
                status: t.status,
                host,
                site,
                pay,
                domain,
                domain_due,
            }
        })
        .collect();

    render(DashboardPage { flash, admin_email: admin.email, rows, summary, storage: state.storage.name() })
}

async fn latest_health(state: &AppState) -> AppResult<HashMap<String, Check>> {
    let rows: Vec<Check> = sqlx::query_as(
        "SELECT host, ok, status_code, latency_ms, error, checked_at FROM health_checks
         WHERE id IN (SELECT max(id) FROM health_checks GROUP BY host)",
    )
    .fetch_all(&state.db)
    .await?;
    Ok(rows.into_iter().map(|c| (c.host.clone(), c)).collect())
}

async fn uptime_24h(state: &AppState) -> AppResult<HashMap<String, f64>> {
    let since = (Utc::now() - chrono::Duration::hours(24)).to_rfc3339();
    Ok(sqlx::query_as::<_, (String, f64)>(
        "SELECT host, avg(ok) * 100.0 FROM health_checks WHERE checked_at > ? GROUP BY host",
    )
    .bind(since)
    .fetch_all(&state.db)
    .await?
    .into_iter()
    .collect())
}

async fn run_checks(_: SuperAdmin, State(state): State<AppState>, headers: HeaderMap) -> AppResult<Response> {
    monitor::run_health_checks(&state).await?;
    let to = headers
        .get(header::REFERER)
        .and_then(|r| r.to_str().ok())
        .and_then(|r| url::Url::parse(r).ok())
        .map(|u| u.path().to_string())
        .filter(|p| p.starts_with("/admin"))
        .unwrap_or_else(|| "/admin".into());
    Ok(back(&to, Ok("Health checks finished.".into())))
}

// ---------- tenants ----------

async fn new_tenant_page(_: SuperAdmin, State(state): State<AppState>, Query(flash): Query<Flash>) -> AppResult<Response> {
    render(NewTenantPage { flash, base_domain: state.cfg.base_domain.clone() })
}

#[derive(Deserialize)]
struct NewTenantForm {
    name: String,
    slug: String,
    contact_name: String,
    contact_email: String,
    price: String,
    currency: String,
    billing_cycle: String,
}

async fn create_tenant(_: SuperAdmin, State(state): State<AppState>, Form(f): Form<NewTenantForm>) -> AppResult<Response> {
    let slug = f.slug.trim().to_lowercase();
    if slug.len() < 2 || slug.len() > 40 || !slug.chars().all(|c| c.is_ascii_lowercase() || c.is_ascii_digit()) {
        return Ok(back("/admin/tenants/new", Err("Slug must be 2–40 lowercase letters or digits.".into())));
    }
    let Some(price) = parse_money(&f.price) else {
        return Ok(back("/admin/tenants/new", Err("Price must be a number, e.g. 120 or 99.50.".into())));
    };
    let cycle = if f.billing_cycle == "monthly" { "monthly" } else { "yearly" };
    let mut tx = state.db.begin().await?;
    let created = sqlx::query(
        "INSERT INTO tenants (slug, name, contact_name, contact_email, price_cents, currency, billing_cycle)
         VALUES (?, ?, ?, ?, ?, ?, ?)",
    )
    .bind(&slug)
    .bind(f.name.trim())
    .bind(f.contact_name.trim())
    .bind(f.contact_email.trim())
    .bind(price)
    .bind(f.currency.trim().to_uppercase())
    .bind(cycle)
    .execute(&mut *tx)
    .await;
    let id = match created {
        Ok(r) => r.last_insert_rowid(),
        Err(sqlx::Error::Database(e)) if e.is_unique_violation() => {
            return Ok(back("/admin/tenants/new", Err(format!("Slug '{slug}' is taken."))));
        }
        Err(e) => return Err(e.into()),
    };
    // Free default subdomain, verified because it is covered by our own DNS.
    sqlx::query("INSERT INTO domains (host, tenant_id, is_primary, verified) VALUES (?, ?, 1, 1)")
        .bind(format!("{slug}.{}", state.cfg.base_domain))
        .bind(id)
        .execute(&mut *tx)
        .await?;
    tx.commit().await?;
    sites::sync_all(&state.db, &state.cfg).await?;
    Ok(back(&tenant_path(id), Ok("Tenant created.".into())))
}

async fn load_tenant(state: &AppState, id: i64) -> AppResult<TenantRow> {
    sqlx::query_as("SELECT * FROM tenants WHERE id = ?").bind(id).fetch_optional(&state.db).await?.ok_or(AppError::NotFound)
}

async fn tenant_page(
    _: SuperAdmin,
    State(state): State<AppState>,
    Path(id): Path<i64>,
    Query(flash): Query<Flash>,
) -> AppResult<Response> {
    let t = load_tenant(&state, id).await?;
    let health = latest_health(&state).await?;
    let uptime = uptime_24h(&state).await?;

    let domains: Vec<DomainRow> = sqlx::query_as::<_, (String, bool, bool)>(
        "SELECT host, is_primary, verified FROM domains WHERE tenant_id = ? ORDER BY is_primary DESC, host",
    )
    .bind(id)
    .fetch_all(&state.db)
    .await?
    .into_iter()
    .map(|(host, is_primary, verified)| DomainRow {
        site: SiteHealth::from_check(t.status == "active", verified, health.get(&host)),
        uptime: uptime.get(&host).map(|u| format!("{u:.1}%")).unwrap_or_else(|| "—".into()),
        is_default: host.ends_with(&format!(".{}", state.cfg.base_domain)),
        host,
        is_primary,
        verified,
    })
    .collect();

    let registrations: Vec<RegistrationRow> = sqlx::query_as::<_, RegistrationDb>(
        "SELECT domain, registrar, expires_at, renewal_price_cents, managed_by_us, rdap_checked_at, rdap_error
         FROM registrations WHERE tenant_id = ? ORDER BY expires_at",
    )
    .bind(id)
    .fetch_all(&state.db)
    .await?
    .into_iter()
    .map(|r| RegistrationRow {
        due: due_status(parse_date(r.expires_at.as_deref()), 30, "Unknown"),
        price: billing::money(r.renewal_price_cents, &t.currency),
        checked: r.rdap_checked_at.as_deref().and_then(|c| c.get(..10)).unwrap_or("never").to_string(),
        domain: r.domain,
        registrar: r.registrar,
        expires_at: r.expires_at.unwrap_or_default(),
        managed_by_us: r.managed_by_us,
        rdap_error: r.rdap_error,
    })
    .collect();

    let payments: Vec<PaymentRow> = sqlx::query_as::<_, (i64, String, i64, String, String, String, String)>(
        "SELECT id, kind, amount_cents, currency, paid_on, method, note FROM payments WHERE tenant_id = ? ORDER BY paid_on DESC, id DESC",
    )
    .bind(id)
    .fetch_all(&state.db)
    .await?
    .into_iter()
    .map(|(id, kind, cents, currency, paid_on, method, note)| PaymentRow {
        id,
        kind,
        amount: billing::money(cents, &currency),
        paid_on,
        method,
        note,
    })
    .collect();

    let users: Vec<UserRow> = sqlx::query_as("SELECT id, email, created_at FROM users WHERE tenant_id = ? ORDER BY email")
        .bind(id)
        .fetch_all(&state.db)
        .await?;

    let checks: Vec<Check> = sqlx::query_as(
        "SELECT host, ok, status_code, latency_ms, error, checked_at FROM health_checks
         WHERE host IN (SELECT host FROM domains WHERE tenant_id = ?) ORDER BY id DESC LIMIT 15",
    )
    .bind(id)
    .fetch_all(&state.db)
    .await?;

    let messages: Vec<MessageRow> = sqlx::query_as(
        "SELECT name, email, subject, message, created_at FROM contact_messages WHERE tenant_id = ? ORDER BY id DESC LIMIT 25",
    )
    .bind(id)
    .fetch_all(&state.db)
    .await?;

    let build_dir = state.cfg.sites_dir.join("tenants").join(&t.slug);
    let build_deployed = tokio::fs::metadata(build_dir.join("index.html")).await.is_ok();

    render(TenantPage {
        flash,
        pay: due_status(parse_date(t.paid_until.as_deref()), 14, "Unpaid"),
        price: format!("{}.{:02}", t.price_cents / 100, t.price_cents % 100),
        build_deployed,
        build_dir: build_dir.display().to_string(),
        base_domain: state.cfg.base_domain.clone(),
        server_ips: state.cfg.server_ips.iter().map(|ip| ip.to_string()).collect::<Vec<_>>().join(", "),
        today: billing::today().to_string(),
        t,
        domains,
        registrations,
        payments,
        users,
        checks,
        messages,
    })
}

#[derive(Deserialize)]
struct UpdateTenantForm {
    name: String,
    status: String,
    contact_name: String,
    contact_email: String,
    notes: String,
    plan_name: String,
    price: String,
    currency: String,
    billing_cycle: String,
    paid_until: String,
}

async fn update_tenant(
    _: SuperAdmin,
    State(state): State<AppState>,
    Path(id): Path<i64>,
    Form(f): Form<UpdateTenantForm>,
) -> AppResult<Response> {
    load_tenant(&state, id).await?;
    let Some(price) = parse_money(&f.price) else {
        return Ok(back(&tenant_path(id), Err("Price must be a number.".into())));
    };
    let paid_until = if f.paid_until.trim().is_empty() {
        None
    } else {
        match parse_date(Some(f.paid_until.trim())) {
            Some(d) => Some(d.to_string()),
            None => return Ok(back(&tenant_path(id), Err("Paid-until must be a date.".into()))),
        }
    };
    let status = if f.status == "suspended" { "suspended" } else { "active" };
    let cycle = if f.billing_cycle == "monthly" { "monthly" } else { "yearly" };
    sqlx::query(
        "UPDATE tenants SET name = ?, status = ?, contact_name = ?, contact_email = ?, notes = ?, plan_name = ?,
            price_cents = ?, currency = ?, billing_cycle = ?, paid_until = ? WHERE id = ?",
    )
    .bind(f.name.trim())
    .bind(status)
    .bind(f.contact_name.trim())
    .bind(f.contact_email.trim())
    .bind(f.notes.trim())
    .bind(f.plan_name.trim())
    .bind(price)
    .bind(f.currency.trim().to_uppercase())
    .bind(cycle)
    .bind(paid_until)
    .bind(id)
    .execute(&state.db)
    .await?;
    sites::sync_all(&state.db, &state.cfg).await?;
    Ok(back(&tenant_path(id), Ok("Saved.".into())))
}

async fn delete_tenant(_: SuperAdmin, State(state): State<AppState>, Path(id): Path<i64>) -> AppResult<Response> {
    sqlx::query("DELETE FROM tenants WHERE id = ?").bind(id).execute(&state.db).await?;
    sites::sync_all(&state.db, &state.cfg).await?;
    Ok(back("/admin", Ok("Tenant deleted. Its static build folder was left on disk.".into())))
}

// ---------- domains ----------

#[derive(Deserialize)]
struct DomainForm {
    host: String,
}

async fn add_domain(
    _: SuperAdmin,
    State(state): State<AppState>,
    Path(id): Path<i64>,
    Form(f): Form<DomainForm>,
) -> AppResult<Response> {
    load_tenant(&state, id).await?;
    let Some(host) = normalize_host(&f.host) else {
        return Ok(back(&tenant_path(id), Err("Enter a hostname like www.example.com.".into())));
    };
    if host == state.cfg.admin_host || !host.contains('.') {
        return Ok(back(&tenant_path(id), Err("That hostname is not allowed.".into())));
    }
    let result = sqlx::query("INSERT INTO domains (host, tenant_id) VALUES (?, ?)").bind(&host).bind(id).execute(&state.db).await;
    match result {
        Ok(_) => Ok(back(&tenant_path(id), Ok(format!("{host} added. Point its DNS here, then press Verify.")))),
        Err(sqlx::Error::Database(e)) if e.is_unique_violation() => {
            Ok(back(&tenant_path(id), Err(format!("{host} is already attached to a tenant."))))
        }
        Err(e) => Err(e.into()),
    }
}

async fn verify_domain(
    _: SuperAdmin,
    State(state): State<AppState>,
    Path((id, host)): Path<(i64, String)>,
) -> AppResult<Response> {
    let (ok, resolved) = sites::dns_points_here(&state.cfg, &host).await?;
    if !ok {
        let seen = if resolved.is_empty() {
            "no DNS records".to_string()
        } else {
            resolved.iter().map(|ip| ip.to_string()).collect::<Vec<_>>().join(", ")
        };
        return Ok(back(&tenant_path(id), Err(format!("{host} resolves to {seen}, not this server yet."))));
    }
    let mut tx = state.db.begin().await?;
    sqlx::query("UPDATE domains SET verified = 1 WHERE host = ? AND tenant_id = ?").bind(&host).bind(id).execute(&mut *tx).await?;
    // First verified custom domain becomes primary automatically.
    let has_custom_primary: Option<(i64,)> = sqlx::query_as(
        "SELECT 1 FROM domains WHERE tenant_id = ? AND is_primary = 1 AND verified = 1 AND host NOT LIKE ?",
    )
    .bind(id)
    .bind(format!("%.{}", state.cfg.base_domain))
    .fetch_optional(&mut *tx)
    .await?;
    tx.commit().await?;
    if has_custom_primary.is_none() && !host.ends_with(&format!(".{}", state.cfg.base_domain)) {
        set_primary(&state, id, &host).await?;
    }
    sites::sync_all(&state.db, &state.cfg).await?;
    Ok(back(&tenant_path(id), Ok(format!("{host} verified. HTTPS is issued on the first visit."))))
}

async fn set_primary(state: &AppState, id: i64, host: &str) -> AppResult<()> {
    let mut tx = state.db.begin().await?;
    sqlx::query("UPDATE domains SET is_primary = 0 WHERE tenant_id = ?").bind(id).execute(&mut *tx).await?;
    sqlx::query("UPDATE domains SET is_primary = 1 WHERE tenant_id = ? AND host = ?").bind(id).bind(host).execute(&mut *tx).await?;
    tx.commit().await?;
    Ok(())
}

async fn make_primary(
    _: SuperAdmin,
    State(state): State<AppState>,
    Path((id, host)): Path<(i64, String)>,
) -> AppResult<Response> {
    let verified: Option<(bool,)> = sqlx::query_as("SELECT verified FROM domains WHERE tenant_id = ? AND host = ?")
        .bind(id)
        .bind(&host)
        .fetch_optional(&state.db)
        .await?;
    if verified != Some((true,)) {
        return Ok(back(&tenant_path(id), Err("Verify the domain before making it primary.".into())));
    }
    set_primary(&state, id, &host).await?;
    sites::sync_all(&state.db, &state.cfg).await?;
    Ok(back(&tenant_path(id), Ok(format!("{host} is now primary. Other domains redirect to it."))))
}

async fn delete_domain(
    _: SuperAdmin,
    State(state): State<AppState>,
    Path((id, host)): Path<(i64, String)>,
) -> AppResult<Response> {
    let primary: Option<(bool,)> = sqlx::query_as("SELECT is_primary FROM domains WHERE tenant_id = ? AND host = ?")
        .bind(id)
        .bind(&host)
        .fetch_optional(&state.db)
        .await?;
    if primary == Some((true,)) {
        return Ok(back(&tenant_path(id), Err("Make another domain primary before removing this one.".into())));
    }
    sqlx::query("DELETE FROM domains WHERE tenant_id = ? AND host = ?").bind(id).bind(&host).execute(&state.db).await?;
    sites::sync_all(&state.db, &state.cfg).await?;
    Ok(back(&tenant_path(id), Ok(format!("{host} removed."))))
}

// ---------- registrations ----------

#[derive(Deserialize)]
struct RegistrationForm {
    domain: String,
    registrar: String,
    expires_at: String,
    renewal_price: String,
    managed_by_us: Option<String>,
}

async fn save_registration(
    _: SuperAdmin,
    State(state): State<AppState>,
    Path(id): Path<i64>,
    Form(f): Form<RegistrationForm>,
) -> AppResult<Response> {
    load_tenant(&state, id).await?;
    let Some(domain) = normalize_host(&f.domain) else {
        return Ok(back(&tenant_path(id), Err("Enter a domain like example.com.".into())));
    };
    let expires = parse_date(Some(f.expires_at.trim())).map(|d| d.to_string());
    let price = parse_money(if f.renewal_price.trim().is_empty() { "0" } else { &f.renewal_price }).unwrap_or(0);
    let result = sqlx::query(
        "INSERT INTO registrations (domain, tenant_id, registrar, expires_at, renewal_price_cents, managed_by_us)
         VALUES (?, ?, ?, ?, ?, ?)
         ON CONFLICT (domain) DO UPDATE SET registrar = excluded.registrar,
            expires_at = coalesce(excluded.expires_at, registrations.expires_at),
            renewal_price_cents = excluded.renewal_price_cents, managed_by_us = excluded.managed_by_us
         WHERE registrations.tenant_id = excluded.tenant_id",
    )
    .bind(&domain)
    .bind(id)
    .bind(f.registrar.trim())
    .bind(&expires)
    .bind(price)
    .bind(f.managed_by_us.is_some())
    .execute(&state.db)
    .await?;
    if result.rows_affected() == 0 {
        return Ok(back(&tenant_path(id), Err(format!("{domain} belongs to another tenant."))));
    }
    if expires.is_none()
        && let Some(err) = monitor::refresh_registration(&state, &domain).await? {
            return Ok(back(&tenant_path(id), Err(format!("Saved, but expiry lookup failed: {err}"))));
        }
    Ok(back(&tenant_path(id), Ok(format!("{domain} saved."))))
}

async fn refresh_registration(
    _: SuperAdmin,
    State(state): State<AppState>,
    Path((id, domain)): Path<(i64, String)>,
) -> AppResult<Response> {
    let owned: Option<(i64,)> = sqlx::query_as("SELECT 1 FROM registrations WHERE domain = ? AND tenant_id = ?")
        .bind(&domain)
        .bind(id)
        .fetch_optional(&state.db)
        .await?;
    if owned.is_none() {
        return Err(AppError::NotFound);
    }
    Ok(match monitor::refresh_registration(&state, &domain).await? {
        None => back(&tenant_path(id), Ok(format!("{domain} refreshed from RDAP."))),
        Some(err) => back(&tenant_path(id), Err(err)),
    })
}

async fn delete_registration(
    _: SuperAdmin,
    State(state): State<AppState>,
    Path((id, domain)): Path<(i64, String)>,
) -> AppResult<Response> {
    sqlx::query("DELETE FROM registrations WHERE domain = ? AND tenant_id = ?").bind(&domain).bind(id).execute(&state.db).await?;
    Ok(back(&tenant_path(id), Ok(format!("{domain} removed from renewal tracking."))))
}

// ---------- payments ----------

#[derive(Deserialize)]
struct PaymentForm {
    kind: String,
    amount: String,
    paid_on: String,
    method: String,
    note: String,
    extend: Option<String>,
}

async fn record_payment(
    _: SuperAdmin,
    State(state): State<AppState>,
    Path(id): Path<i64>,
    Form(f): Form<PaymentForm>,
) -> AppResult<Response> {
    let t = load_tenant(&state, id).await?;
    let Some(amount) = parse_money(&f.amount) else {
        return Ok(back(&tenant_path(id), Err("Amount must be a number.".into())));
    };
    let Some(paid_on) = parse_date(Some(f.paid_on.trim())) else {
        return Ok(back(&tenant_path(id), Err("Paid-on must be a date.".into())));
    };
    let kind = match f.kind.as_str() {
        "domain" => "domain",
        "other" => "other",
        _ => "hosting",
    };
    let mut tx = state.db.begin().await?;
    sqlx::query("INSERT INTO payments (tenant_id, kind, amount_cents, currency, paid_on, method, note) VALUES (?, ?, ?, ?, ?, ?, ?)")
        .bind(id)
        .bind(kind)
        .bind(amount)
        .bind(&t.currency)
        .bind(paid_on.to_string())
        .bind(f.method.trim())
        .bind(f.note.trim())
        .execute(&mut *tx)
        .await?;
    let mut msg = "Payment recorded.".to_string();
    if kind == "hosting" && f.extend.is_some() {
        let until = billing::extend(parse_date(t.paid_until.as_deref()), paid_on, &t.billing_cycle);
        sqlx::query("UPDATE tenants SET paid_until = ? WHERE id = ?").bind(until.to_string()).bind(id).execute(&mut *tx).await?;
        msg = format!("Payment recorded. Hosting paid until {until}.");
    }
    tx.commit().await?;
    Ok(back(&tenant_path(id), Ok(msg)))
}

async fn delete_payment(
    _: SuperAdmin,
    State(state): State<AppState>,
    Path((id, pid)): Path<(i64, i64)>,
) -> AppResult<Response> {
    sqlx::query("DELETE FROM payments WHERE id = ? AND tenant_id = ?").bind(pid).bind(id).execute(&state.db).await?;
    Ok(back(&tenant_path(id), Ok("Payment deleted. Paid-until was not changed.".into())))
}

// ---------- editors ----------

#[derive(Deserialize)]
struct UserForm {
    email: String,
    password: String,
}

async fn add_user(
    _: SuperAdmin,
    State(state): State<AppState>,
    Path(id): Path<i64>,
    Form(f): Form<UserForm>,
) -> AppResult<Response> {
    load_tenant(&state, id).await?;
    let email = f.email.trim().to_lowercase();
    if !email.contains('@') {
        return Ok(back(&tenant_path(id), Err("Enter a valid email.".into())));
    }
    let hash = match auth::hash_password(f.password).await {
        Ok(h) => h,
        Err(AppError::BadRequest(m)) => return Ok(back(&tenant_path(id), Err(m))),
        Err(e) => return Err(e),
    };
    let result = sqlx::query("INSERT INTO users (tenant_id, email, password_hash) VALUES (?, ?, ?)")
        .bind(id)
        .bind(&email)
        .bind(hash)
        .execute(&state.db)
        .await;
    match result {
        Ok(_) => Ok(back(&tenant_path(id), Ok(format!("{email} can now sign in on the site.")))),
        Err(sqlx::Error::Database(e)) if e.is_unique_violation() => {
            Ok(back(&tenant_path(id), Err(format!("{email} already exists for this tenant."))))
        }
        Err(e) => Err(e.into()),
    }
}

#[derive(Deserialize)]
struct PasswordForm {
    password: String,
}

async fn reset_password(
    _: SuperAdmin,
    State(state): State<AppState>,
    Path((id, uid)): Path<(i64, i64)>,
    Form(f): Form<PasswordForm>,
) -> AppResult<Response> {
    let hash = match auth::hash_password(f.password).await {
        Ok(h) => h,
        Err(AppError::BadRequest(m)) => return Ok(back(&tenant_path(id), Err(m))),
        Err(e) => return Err(e),
    };
    let mut tx = state.db.begin().await?;
    let updated = sqlx::query("UPDATE users SET password_hash = ? WHERE id = ? AND tenant_id = ?")
        .bind(hash)
        .bind(uid)
        .bind(id)
        .execute(&mut *tx)
        .await?;
    if updated.rows_affected() == 0 {
        return Err(AppError::NotFound);
    }
    sqlx::query("DELETE FROM sessions WHERE user_id = ?").bind(uid).execute(&mut *tx).await?;
    tx.commit().await?;
    Ok(back(&tenant_path(id), Ok("Password reset. Existing sessions were signed out.".into())))
}

async fn delete_user(
    _: SuperAdmin,
    State(state): State<AppState>,
    Path((id, uid)): Path<(i64, i64)>,
) -> AppResult<Response> {
    sqlx::query("DELETE FROM users WHERE id = ? AND tenant_id = ?").bind(uid).bind(id).execute(&state.db).await?;
    Ok(back(&tenant_path(id), Ok("Editor removed.".into())))
}
