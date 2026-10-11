# sites/

One folder per client. The folder name **is** the client's slug in the admin, so `sites/adi` is the tenant `adi`.

| Site | Live at | Template it started from |
|---|---|---|
| [`adi/`](adi/) | asiacan.sollari.app | (original design, ported from React) |
| [`sollari/`](sollari/) | www.sollari.app | Nova template by WebScale (separate Astro 7 + Tailwind 4 setup, see its README) |

Each site is a standalone Astro project: its own `package.json`, its own design, and nothing shared with other sites. To start one, run `../scripts/new-site.sh <slug> [template]`, and add a row to the table above.

Inside a site:
- `src/pages/index.astro` assembles the page.
- `src/sections/` and `src/components/` hold the markup.
- `src/scripts/` holds the small browser scripts that talk to the API.
- `src/lib/api.ts` is the client for the Folio API.

Deploy one: `../scripts/deploy-site.sh <slug>`.
