# Folio: notes for Claude

Multi-tenant hosting for small client websites. One Rust server (`server/`) and one static Astro site per client (`sites/<slug>`). Read `README.md` for the map; this file holds the rules and the details that are easy to get wrong.

## Skills in this repo (use them, don't improvise)

| Task | Skill |
|---|---|
| New client / tenant site | `/new-site` |
| New reusable design | `/new-template` |
| Give a site a hostname | `/add-domain` |
| Put a site or the server live | `/deploy` |

## Layout

- `sites/<slug>/` holds a client's Astro site. The folder name equals the tenant slug in the admin. Sites are independent: never import from another site.
- `templates/<name>/` holds starting designs, copied by `scripts/new-site.sh`. Never deployed. Editing a template doesn't change existing sites.
- `server/` is the Rust/Axum/SQLite API plus the HTMX admin. `server/README.md` has a file map.
- `scripts/` has `new-site.sh`, `new-template.sh`, `deploy-site.sh` and `deploy-server.sh`.
- `deploy/tunnel/` is the live VPS setup; `deploy/caddy/` is an unused alternative.

## Hard rules

1. **Tenant isolation = one SQLite file per tenant.** Client content (site text, posts, sections, contact messages) lives in `tenants/<slug>.db`, reached only through `state.tenant_db(&tenant)` in handlers that take the `Tenant` / `Editor` extractor. Platform data (tenants, domains, billing, users, sessions, health) lives in the control DB `folio.db`, keyed by `tenant_id`. New client-content tables go in `server/migrations/tenant/`, and platform tables in `server/migrations/control/`.
2. **ADI must look identical.** `sites/adi` was ported pixel-for-pixel from a React site. Don't restyle it unless asked. Its inline editor derives text keys from DOM position (`src/scripts/editor.ts`), so restructuring section markup orphans saved text edits. Keep the element structure unchanged.
3. **door2door is off limits.** The VPS (163.223.98.6, SSH port 41447, root) also runs an unrelated production app, `door2door-*` containers. Never touch its containers, Docker network, Caddy config (`/opt/door2door-tenancy`), ports 80/443 or the firewall. Folio lives only in `/opt/folio`, `/srv/folio` and `/srv/sites`.
4. **Ask before outward-facing actions:** deploys, DNS changes, editing anything on the VPS, and changing passwords. The user approves these one at a time.
5. **No secrets in git.** `server/.env` and `sites/*/.env` are gitignored. Site `.env` holds only `PUBLIC_*` values. R2 keys belong to the server.

## Production facts

- Live: `asiacan.sollari.app` → tenant `adi`; `folio.sollari.app/admin` → owner admin.
- The VPS runs `/opt/folio/docker-compose.yml` with three services:
  - `folio-api`: the Rust image `folio:latest`, built on the VPS from `/opt/folio/src`.
  - `folio-web`: Caddy serving `/srv/sites/hosts/<host>`.
  - `tunnel`: cloudflared.
- No published ports. Traffic arrives through a Cloudflare Tunnel (`folio`, config in `/opt/folio/cloudflared/config.yml`).
- `/srv/sites/tenants/<slug>/` holds the uploaded build. `/srv/sites/hosts/<host>` symlinks are managed by the server; don't create them by hand.
- Databases: `/srv/folio/data/folio.db` (control) plus `/srv/folio/data/tenants/<slug>.db` (one per client). Back them **all** up before server deploys (the `/deploy` skill does this).
- `/opt/folio/.env` has `SERVER_IPS=` (empty) on purpose. In tunnel mode DNS points at Cloudflare, so an IP check would fail. Don't set it back.
- Cloudflare Email Obfuscation rewrites `mailto:` links in transit. That's expected; visitors see the real address.

## Commands

```sh
# server
cd server && cargo test && cargo clippy -- -D warnings
cd server && set -a && . ./.env && set +a && cargo run        # local, :3000 / :3001

# a site
cd sites/<slug> && npm install && npm start                   # dev, proxies /api to local server
cd sites/<slug> && npm run lint && npm run build              # build runs `astro check` first
```

## Conventions

- Sites: Astro + Tailwind 3 + small vanilla TS modules in `src/scripts/`. No UI framework. Dynamic markup lives in `<template data-tpl="…">` elements in `.astro` files, so Tailwind sees the classes. Scripts clone the templates.
- Server: Axum handlers return `AppResult<…>`, and admin handlers redirect with `?msg=`/`?err=` flashes. Add new schema as a new `server/migrations/000N_*.sql`.
- Verify changes for real: build, run the server locally, and check the site in a browser. For ADI changes, compare screenshots before and after.
