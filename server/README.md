# server/

The one Rust process behind every site. It serves the tenant JSON API (`/api/*`), the owner admin (`/admin/*`) and the Caddy TLS check (`:3001/tls-check`), and runs background health and domain-expiry checks.

Stack: Axum · SQLite (WAL, via sqlx) · Askama templates + HTMX for the admin. About 35 MB RAM in production.

## File map

| File | What it does |
|---|---|
| `src/main.rs` | Startup, CLI commands (`serve`, `create-superadmin`, `import-supabase`), routers, the Caddy `tls-check`, and alias-domain redirects |
| `src/config.rs` | Every environment variable, with defaults |
| `src/state.rs` | Shared app state (DB pool, HTTP client, storage) and the in-memory rate limiter |
| `src/db.rs` | SQLite connection settings and migrations |
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
| `src/import.rs` | One-off Supabase → Folio content import |
| `migrations/` | Database schema. Add `0002_*.sql` and so on; never edit an applied migration |

## Adding something

- **A new API endpoint for sites:** add a route in `src/api/mod.rs`. Take `tenant: Tenant` for public endpoints or `editor: Editor` for signed-in ones, and filter every query by `tenant.id` / `editor.tenant.id`.
- **A new table:** create a new migration file. Give the table `tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE` and an index that starts with `tenant_id`.
- **A new admin screen:** add a handler in `src/admin/mod.rs`, a struct in `views.rs` and a template in `templates/admin/`. Take `_: SuperAdmin` as the first argument so it's owner-only.

## Run and check

```sh
set -a && . ./.env && set +a      # local settings (gitignored); see the list below
cargo run                          # :3000 public, :3001 internal
cargo test && cargo clippy -- -D warnings
```

`.env` keys for local dev: `ADMIN_HOST=admin.localhost`, `BASE_DOMAIN=localhost`, `SECURE_COOKIES=false`, `HEALTH_SCHEME=http`, plus the optional `R2_ENDPOINT`, `R2_BUCKET`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY` and `R2_PUBLIC_URL`. All variables with their defaults are in `src/config.rs`.

Deploy: `../scripts/deploy-server.sh`. It rebuilds the image on the VPS and recreates only the API container.
