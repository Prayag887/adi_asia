# server/

The one Rust process behind every site. It serves the tenant JSON API (`/api/*`), the owner admin (`/admin/*`) and the Caddy TLS check (`:3001/tls-check`), and runs background health and domain-expiry checks.

Stack: Axum · SQLite (WAL, via sqlx) with one control DB plus one DB file per tenant · Askama templates + HTMX for the admin. About 35 MB RAM in production.

**Capacity** (measured on an Apple M2 with 2 worker threads): 20 tenants at 100 req/s each (2,000 req/s) gave 0 errors, a 3 ms median and a 33 ms p99. The ceiling is about 50,000 req/s, and peak RSS was 38 MB. Idle tenant databases close after 60 s.

## File map

| File | What it does |
|---|---|
| `src/main.rs` | Startup, CLI commands (`serve`, `create-superadmin`), routers, the Caddy `tls-check`, alias-domain redirects, and the end-to-end tests |
| `src/config.rs` | Every environment variable, with defaults |
| `src/state.rs` | Shared app state (DB pool, HTTP client, storage) and the in-memory rate limiter |
| `src/db.rs` | SQLite: the control DB, the lazy per-tenant DB registry (`TenantDbs`) and the one-time move of old shared data |
| `src/error.rs` | `AppError`, which becomes the JSON `{ "error": "…" }` responses |
| `src/tenant.rs` | **Host header → tenant** (the `Tenant` extractor) and hostname validation |
| `src/auth.rs` | Passwords (argon2), session cookies, and the `Editor` / `SuperAdmin` extractors |
| `src/api/mod.rs` | **Tenant API**: login, site text, posts, uploads, sections, custom sections, contact form |
| `src/admin/mod.rs` | **Owner admin** routes: sites, domains, renewals, payments, editors, health |
| `src/admin/views.rs` | Data shapes the admin templates render |
| `templates/admin/*.html` | Admin pages (Askama; the syntax is close to Jinja) |
| `static/` | `admin.css` and `htmx.min.js`, compiled into the binary |
| `src/sites.rs` | Keeps the `/srv/sites/hosts/<host>` → `tenants/<slug>` symlinks in sync; DNS check |
| `src/monitor.rs` | Background jobs: uptime checks, RDAP domain-expiry lookups, cleanup |
| `src/billing.rs` | Due-date and money helpers (paid-until, days left) |
| `src/storage.rs` | Image uploads to Cloudflare R2 (or local disk) |
| `migrations/control/` | Platform schema (`folio.db`): tenants, domains, billing, users, sessions, health |
| `migrations/tenant/` | Client schema (each `tenants/<slug>.db`): site text, posts, sections, contact messages |

## Adding something

- **A new API endpoint for sites:** add a route in `src/api/mod.rs`. Take `tenant: Tenant` for public endpoints or `editor: Editor` for signed-in ones, and run content queries on `state.tenant_db(&tenant)` / `state.tenant_db(&editor.tenant)`.
- **A new table:** decide whose data it is.
  - A client's content goes in a new `migrations/tenant/000N_*.sql`. No `tenant_id` column, because the file is the tenant. Query it with `state.tenant_db(&tenant).await?`.
  - Platform data goes in `migrations/control/000N_*.sql`, with a `tenant_id` foreign key if it belongs to a site.
  - Never edit a migration that has already been applied.
- **A new admin screen:** add a handler in `src/admin/mod.rs`, a struct in `views.rs` and a template in `templates/admin/`. Take `_: SuperAdmin` as the first argument so it's owner-only.

## Run and check

```sh
set -a && . ./.env && set +a      # local settings (gitignored); see the list below
cargo run                          # :3000 public, :3001 internal
cargo test && cargo clippy -- -D warnings
```

`.env` keys for local dev: `ADMIN_HOST=admin.localhost`, `BASE_DOMAIN=localhost`, `SECURE_COOKIES=false`, `HEALTH_SCHEME=http`, plus the optional `R2_ENDPOINT`, `R2_BUCKET`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY` and `R2_PUBLIC_URL`. All variables with their defaults are in `src/config.rs`.

Deploy: `../scripts/deploy-server.sh`. It rebuilds the image on the VPS and recreates only the API container.
