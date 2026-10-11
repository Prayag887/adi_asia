---
name: new-site
description: Create a new client (tenant) website in this Folio repo from a template, get it running locally against the Folio server, and register it in the admin. Use when the user wants to start a site for a new client, add a tenant, or "make a site for <client>".
---

# New client site

A client site = a folder `sites/<slug>` (static Astro project) + a tenant with the same slug in the Folio admin. Both are needed.

## 1. Collect what you need (ask only for what's missing)

- **Client name** (e.g. "Acme Studio") and **slug**: 2+ lowercase letters/digits, e.g. `acme`. The slug is permanent; it names the folder, the tenant, and the R2 upload prefix.
- **Template**: list with `ls templates` and read `templates/README.md`. Default `basic`.
- Their content/brand if they have it (logo, colours, copy). Placeholders are fine to start.

## 2. Scaffold

```sh
./scripts/new-site.sh <slug> [template]
cd sites/<slug> && npm install
```

Then customise in `sites/<slug>`:
- `src/pages/index.astro`: site name, sections, copy.
- `tailwind.config.js`: `brand`/`accent` colours and fonts.
- `.env`: `PUBLIC_R2_URL` only if the site uses R2 assets.
Keep `src/lib/api.ts` and the `data-*` hooks the scripts use (blog list, contact form) unless you're replacing those features.

Add a row for the site to `sites/README.md`.

## 3. Run it locally against Folio

```sh
# terminal 1
cd server && set -a && . ./.env && set +a && cargo run
# one-time local owner login, if none exists yet:
FOLIO_PASSWORD='local-dev-password' cargo run -- create-superadmin dev@example.com
```

In http://admin.localhost:3000/admin, go to **New site** and give it the same slug. It automatically gets `<slug>.localhost`. Add an editor login.

```sh
# terminal 2
cd sites/<slug> && npm start        # proxies /api with Host: <slug>.localhost
```

## 4. Verify before calling it done

- `npm run lint && npm run build` has 0 errors.
- In a browser, the page renders, the blog list loads (shows "No posts yet." when empty), and the contact form submits. The message should show up on the site's page in the local admin.
- Check mobile width (390px) and desktop width (1440px) for horizontal overflow.

## 5. Production (only when the user asks, and confirm first)

1. Production admin (https://folio.sollari.app/admin): **New site** with the same slug, then add an editor.
2. Hostname: use the `/add-domain` skill.
3. Deploy: use the `/deploy` skill (`./scripts/deploy-site.sh <slug>`).
