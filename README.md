# Folio

Hosts many small client websites from one tiny server.

- Each client gets a **static site**: fast, cheap, and served straight from disk.
- One shared **Rust server** gives every site its dynamic parts: editor login, inline text editing, blog posts, image uploads and the contact form.
- An **owner admin** shows you every site's health, domains, payments and domain renewals.

Live: **asiacan.sollari.app** (ADI) · admin at **folio.sollari.app/admin**

## Where things are

| Folder | What's in it | When you touch it |
|---|---|---|
| [`sites/`](sites/) | One folder per client (`sites/adi`, …). Each is its own Astro project. | Building or changing a client's website |
| [`templates/`](templates/) | Reusable starting designs (`templates/basic`, …) | Creating a new look you'll reuse |
| [`server/`](server/) | The shared Rust API + admin | Adding a feature for *all* sites |
| [`scripts/`](scripts/) | One-command tasks (below) | Every day |
| [`deploy/`](deploy/) | How the VPS is set up | Rarely |

## Everyday tasks

| I want to… | Run |
|---|---|
| Start a new client site | `./scripts/new-site.sh acme` (or `./scripts/new-site.sh acme <template>`) |
| Make a reusable design | `./scripts/new-template.sh minimal`, or from a client: `./scripts/new-template.sh elegant --from adi` |
| Work on a site locally | `cd sites/acme && npm install && npm start` |
| Put a site live | `./scripts/deploy-site.sh acme` |
| Ship a server change | `./scripts/deploy-server.sh` |

After creating a site, also open the admin: **New site** with the same slug, then add its domain and an editor login. To give it a hostname, follow [`deploy/tunnel/README.md`](deploy/tunnel/README.md#adding-a-site-hostname).

## How it fits together

```
visitor ──► Cloudflare ──tunnel──► folio-web (Caddy) ──► /srv/sites/hosts/<host>/   static files
                                       │
                                       └── /api, /admin ──► folio-api (Rust) ──► folio.db (platform)
                                                                               tenants/<slug>.db (one per client)
```

- The server picks the site from the request's **Host** header. `asiacan.sollari.app` maps to the tenant `adi`.
- Static pages are built in CI or on your machine and copied to `/srv/sites/tenants/<slug>/`. A site's content (text edits, posts) is loaded from `/api` at runtime, so editors never need a rebuild.

## Run everything locally

```sh
# 1. server (from server/)
cd server && set -a && . ./.env && set +a              # .env: see server/README.md
FOLIO_PASSWORD='a-long-password' cargo run -- create-superadmin you@example.com
cargo run                                              # http://admin.localhost:3000/admin

# 2. a site (from another terminal)
cd sites/adi && npm start                              # proxies /api to the local server
```

In the local admin, create a site whose slug matches the folder (`adi`). It gets `adi.localhost` automatically.

## Rules that keep this working

1. **One client, one folder.** Never import across `sites/*`. Shared needs go in `server/`, and shared looks go in `templates/`.
2. **Each client's content lives in its own SQLite file** (`tenants/<slug>.db`). The control database (`folio.db`) holds only platform data: sites, domains, billing, logins.
3. **Never edit `templates/*` to change a live site.** A site is a copy; change it in `sites/<slug>`.
4. The VPS also runs **door2door**, an unrelated project. Folio must never touch its containers, network, Caddy config or ports.

CI: [`.github/workflows/server.yml`](.github/workflows/server.yml) (server) and [`sites.yml`](.github/workflows/sites.yml) (only the sites that changed). They need the secrets `VPS_HOST`, `VPS_USER`, `VPS_PORT` and `VPS_SSH_KEY`, and the variable `PUBLIC_R2_URL`.
