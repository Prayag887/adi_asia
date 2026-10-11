# Template: basic

A plain one-page starter (hero, about, blog list, contact form) already connected to Folio. Use it as the base for a custom design:

```sh
./scripts/new-site.sh <slug>            # from the repo root; basic is the default template
```

- Astro + Tailwind 3. The output is static, so there's no server code here.
- `src/lib/api.ts` is the client for the Folio API (posts, site text, sections, contact form, auth, uploads).
- `src/scripts/blog.ts` and `src/scripts/contact.ts` load data at runtime through small `<template>` elements in `index.astro`.
- `tailwind.config.js` has the `brand` / `accent` colours and fonts to change for each client.

Dev: `npm start`. It proxies `/api` to a local Folio, sending `Host: <slug>.localhost`.
