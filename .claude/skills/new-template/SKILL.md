---
name: new-template
description: Create a reusable design template under templates/ for future client sites, either from the basic starter or by generalising an existing client site's design. Use when the user wants a new theme, starter, or reusable layout.
---

# New template

Templates are starting points that get copied into `sites/<slug>` by `scripts/new-site.sh`. They are never deployed, and editing one never affects existing sites.

## 1. Decide the source

- Fresh design: `./scripts/new-template.sh <name>` copies `templates/basic`.
- Reuse a client's look: `./scripts/new-template.sh <name> --from <site>` (e.g. `--from adi`).
- Variant of another template: `./scripts/new-template.sh <name> --from-template <template>`.

`<name>`: lowercase letters/digits/dashes, describing the look (`minimal`, `elegant-dark`), not a client.

## 2. Make it generic (required when copying from a site)

Go through `templates/<name>/src` and replace anything client-specific:
- names, copy, emails, addresses and phone numbers become neutral placeholders ("Client Name", "hello@example.com")
- logo and image URLs become placeholders or empty strings
- brand colours go in one place (`tailwind.config.js`) where possible
- delete sections that only made sense for that client

Keep working:
- `src/lib/api.ts` (unchanged)
- the scripts and their `data-*` hooks (blog, contact, and the editor, if present)
- `astro.config.mjs` dev proxy

## 3. Verify

```sh
cd templates/<name> && npm install && npm run lint && npm run build
```

Then prove it works as a starter. Create a throwaway site, build it, and delete it:

```sh
./scripts/new-site.sh zzcheck <name> && (cd sites/zzcheck && npm install && npm run build) ; rm -rf sites/zzcheck
```

Optionally run it against a local server (see the `/new-site` skill, step 3) and check it in a browser.

## 4. Document

Add a row to `templates/README.md`: name, what it looks like, and what it's good for. Remove `node_modules`, `dist` and `.astro` from the template folder; they're gitignored, but keep the folder lean.
