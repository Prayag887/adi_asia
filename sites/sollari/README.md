# Sollari (www.sollari.app)

Sollari's own company website: e-commerce apps, company websites, mobile apps and custom platforms.

Built on the free **Nova** template by [WebScale](https://webscale.pl) (Astro 7 + Tailwind 4). Its license is in `LICENSE.md` (keep it, and keep the attribution in the footer), and third-party asset notes are in `ASSETS-LICENSES.md`. The template's original docs are in [`docs/template/`](docs/template/).

## Where to edit

| What | File |
|---|---|
| All homepage copy (hero, work, services, stack, FAQ, reviews, footer) | `src/data/i18n/nova.json` (English only) |
| Section order | `src/data/pages/index.json` |
| Contact section text and form fields | `src/data/sections/contact.json`, `src/data/global/form-messages.json` |
| Company name, icon, URL | `src/data/global/company.json`, `site.config.mjs` |
| Images (real screenshots of our projects) | `public/assets/images/sollari/` |
| Colours and fonts | `design/nova.md`, then `npm run design:sync` |

The **contact form** posts to Folio's `/api/contact` (see `public/js/form-handler.js`). Messages appear in the admin on the Sollari site page, and are stored in that site's own database.

**Reviews** are in `src/data/i18n/nova.json` → `testimonial-v2`. Only publish quotes the person has approved.

## Commands

```sh
npm install
npm run dev            # http://localhost:4321, proxies /api to FOLIO_API_URL with Host FOLIO_DEV_HOST
npm run ai:check       # types + data contracts + 867 unit tests
npm run build          # static site in dist/
../../scripts/deploy-site.sh sollari
```
