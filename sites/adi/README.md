# Asia Dialogue Initiative

ADI is a static Astro site (Tailwind, a little vanilla TypeScript, no UI framework) with a private editorial experience. It is one tenant on the shared **Folio** platform (this repo's `server/`), which provides auth, content, blog posts, image uploads (Cloudflare R2) and the contact form through a same-origin `/api`.

## Local development

1. Run the Folio server locally (see the root `README.md`), create a site with slug `adi`, and add an editor.
2. Copy `.env.example` to `.env`.
3. `npm start` (Astro dev server). It proxies `/api` to `FOLIO_API_URL`, sending `Host: FOLIO_DEV_HOST`, which selects the tenant.

## Layout

- `src/pages/index.astro` assembles the page; `src/sections/*.astro` hold the static sections.
- `src/components/*.astro` hold the navigation, blog, reader, login and editor panels. Dynamic pieces are rendered from `<template>` elements.
- `src/scripts/*.ts` hold the interactivity (auth, blog, inline editor, sections, typography), sharing a small store in `state.ts`.
- The inline editor derives each text's key from its DOM position. If you restructure a section's markup, its saved text overrides will no longer match.

- Editor workflow: sign in from the site, select **Edit site**, edit text directly in the live layout, then select **Save changes** at the bottom of the page.
- Blog workflow: sign in, select **Write a post**, upload a cover image, and publish.

## Deploying

From the repo root, run `./scripts/deploy-site.sh adi`. It builds the site and uploads `dist/` to `/srv/sites/tenants/adi/` on the VPS, and Caddy serves it from there. Pushing changes under `sites/adi/` to `main` does the same through CI.

## Migrating from Supabase (once)

```sh
SUPABASE_URL=https://xxxx.supabase.co SUPABASE_ANON_KEY=... folio import-supabase adi
```

This copies site text, published posts, section visibility and custom sections. Existing cover-image URLs keep working because they point at R2. Editor accounts are re-created in the Folio admin.
