use askama::Template;
use serde::Deserialize;

use crate::billing::Due;

#[derive(Deserialize, Default)]
pub struct Flash {
    pub msg: Option<String>,
    pub err: Option<String>,
}

#[derive(sqlx::FromRow)]
pub struct TenantRow {
    pub id: i64,
    pub slug: String,
    pub name: String,
    pub status: String,
    pub contact_name: String,
    pub contact_email: String,
    pub notes: String,
    pub plan_name: String,
    pub price_cents: i64,
    pub currency: String,
    pub billing_cycle: String,
    pub paid_until: Option<String>,
    pub created_at: String,
}

#[derive(sqlx::FromRow)]
pub struct Check {
    pub host: String,
    pub ok: bool,
    pub status_code: Option<i64>,
    pub latency_ms: Option<i64>,
    pub error: Option<String>,
    pub checked_at: String,
}

impl Check {
    pub fn when(&self) -> &str {
        self.checked_at.get(..16).unwrap_or(&self.checked_at)
    }

    pub fn detail(&self) -> String {
        match (&self.status_code, &self.error) {
            (Some(code), _) => format!("HTTP {code}"),
            (None, Some(e)) => e.chars().take(120).collect(),
            _ => String::new(),
        }
    }

    pub fn latency(&self) -> String {
        self.latency_ms.map(|l| format!("{l} ms")).unwrap_or_else(|| "—".into())
    }
}

pub struct SiteHealth {
    pub label: String,
    pub class: &'static str,
    pub latency: String,
}

impl SiteHealth {
    pub fn from_check(active: bool, has_host: bool, check: Option<&Check>) -> Self {
        let (label, class) = match (active, has_host, check) {
            (false, _, _) => ("Suspended".to_string(), "muted"),
            (_, false, _) => ("No domain".to_string(), "muted"),
            (_, _, None) => ("Not checked".to_string(), "muted"),
            (_, _, Some(c)) if c.ok => ("Up".to_string(), "good"),
            (_, _, Some(c)) => (format!("Down · {}", c.detail()), "bad"),
        };
        SiteHealth { label, class, latency: check.map(Check::latency).unwrap_or_else(|| "—".into()) }
    }
}

#[derive(Default)]
pub struct Summary {
    pub total: usize,
    pub up: usize,
    pub down: usize,
    pub overdue: usize,
    pub domains_expiring: usize,
}

pub struct DashboardRow {
    pub id: i64,
    pub name: String,
    pub slug: String,
    pub status: String,
    pub host: Option<String>,
    pub site: SiteHealth,
    pub uptime: String,
    pub pay: Due,
    pub price: String,
    pub domain: Option<String>,
    pub domain_due: Due,
}

pub struct DomainRow {
    pub host: String,
    pub is_primary: bool,
    pub verified: bool,
    pub is_default: bool,
    pub site: SiteHealth,
    pub uptime: String,
}

#[derive(sqlx::FromRow)]
pub struct RegistrationDb {
    pub domain: String,
    pub registrar: String,
    pub expires_at: Option<String>,
    pub renewal_price_cents: i64,
    pub managed_by_us: bool,
    pub rdap_checked_at: Option<String>,
    pub rdap_error: Option<String>,
}

pub struct RegistrationRow {
    pub domain: String,
    pub registrar: String,
    pub expires_at: String,
    pub price: String,
    pub managed_by_us: bool,
    pub checked: String,
    pub rdap_error: Option<String>,
    pub due: Due,
}

pub struct PaymentRow {
    pub id: i64,
    pub kind: String,
    pub amount: String,
    pub paid_on: String,
    pub method: String,
    pub note: String,
}

#[derive(sqlx::FromRow)]
pub struct UserRow {
    pub id: i64,
    pub email: String,
    pub created_at: String,
}

#[derive(sqlx::FromRow)]
pub struct MessageRow {
    pub name: String,
    pub email: String,
    pub subject: String,
    pub message: String,
    pub created_at: String,
}

#[derive(Template)]
#[template(path = "admin/login.html")]
pub struct LoginPage {
    pub flash: Flash,
}

#[derive(Template)]
#[template(path = "admin/dashboard.html")]
pub struct DashboardPage {
    pub flash: Flash,
    pub admin_email: String,
    pub rows: Vec<DashboardRow>,
    pub summary: Summary,
    pub storage: &'static str,
}

#[derive(Template)]
#[template(path = "admin/tenant_new.html")]
pub struct NewTenantPage {
    pub flash: Flash,
    pub base_domain: String,
}

#[derive(Template)]
#[template(path = "admin/tenant.html")]
pub struct TenantPage {
    pub flash: Flash,
    pub t: TenantRow,
    pub pay: Due,
    pub price: String,
    pub build_deployed: bool,
    pub build_dir: String,
    pub base_domain: String,
    pub server_ips: String,
    pub today: String,
    pub domains: Vec<DomainRow>,
    pub registrations: Vec<RegistrationRow>,
    pub payments: Vec<PaymentRow>,
    pub users: Vec<UserRow>,
    pub checks: Vec<Check>,
    pub messages: Vec<MessageRow>,
}
