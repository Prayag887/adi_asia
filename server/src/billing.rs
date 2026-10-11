use chrono::{Months, NaiveDate, Utc};

pub fn today() -> NaiveDate {
    Utc::now().date_naive()
}

pub fn parse_date(s: Option<&str>) -> Option<NaiveDate> {
    s.and_then(|s| NaiveDate::parse_from_str(s.get(..10)?, "%Y-%m-%d").ok())
}

/// Status pill shown in the admin: (label, css class, days remaining).
pub struct Due {
    pub label: String,
    pub class: &'static str,
    pub days: Option<i64>,
}

pub fn due_status(until: Option<NaiveDate>, warn_days: i64, missing_label: &str) -> Due {
    let Some(until) = until else {
        return Due { label: missing_label.to_string(), class: "muted", days: None };
    };
    let days = (until - today()).num_days();
    let (label, class) = match days {
        d if d < 0 => (format!("Overdue {}d", -d), "bad"),
        0 => ("Due today".to_string(), "bad"),
        d if d <= warn_days => (format!("{d}d left"), "warn"),
        d => (format!("{d}d left"), "good"),
    };
    Due { label, class, days: Some(days) }
}

/// Extends a paid-until date by one billing cycle. Overdue tenants are extended from
/// their old due date so a late payment does not grant free time.
pub fn extend(paid_until: Option<NaiveDate>, paid_on: NaiveDate, cycle: &str) -> NaiveDate {
    let from = paid_until.unwrap_or(paid_on);
    let months = if cycle == "monthly" { 1 } else { 12 };
    from.checked_add_months(Months::new(months)).unwrap_or(from)
}

pub fn money(cents: i64, currency: &str) -> String {
    format!("{currency} {}.{:02}", cents / 100, (cents % 100).abs())
}

pub fn parse_money(input: &str) -> Option<i64> {
    let input = input.trim().replace(',', "");
    let (whole, frac) = input.split_once('.').unwrap_or((&input, "0"));
    let whole: i64 = whole.parse().ok()?;
    let frac = format!("{frac:0<2}");
    let frac: i64 = frac.get(..2)?.parse().ok()?;
    (whole >= 0).then_some(whole * 100 + frac)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn extends_from_old_due_date() {
        let d = |s| NaiveDate::parse_from_str(s, "%Y-%m-%d").unwrap();
        assert_eq!(extend(Some(d("2026-01-31")), d("2026-03-01"), "monthly"), d("2026-02-28"));
        assert_eq!(extend(None, d("2026-03-01"), "yearly"), d("2027-03-01"));
    }

    #[test]
    fn parses_money() {
        assert_eq!(parse_money("120"), Some(12000));
        assert_eq!(parse_money("1,200.5"), Some(120050));
        assert_eq!(parse_money("9.99"), Some(999));
        assert_eq!(parse_money("abc"), None);
    }
}
