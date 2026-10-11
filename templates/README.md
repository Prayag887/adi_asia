# templates/

Reusable starting designs. **Templates are never deployed.** A new site is a *copy* of a template, so you can edit templates freely without affecting live sites.

| Template | Looks like | Good for |
|---|---|---|
| [`basic/`](basic/) | Plain, single page: hero, about, blog list, contact | Starting point for any custom design |

- New template: `../scripts/new-template.sh <name>` (copies `basic`), or `../scripts/new-template.sh <name> --from <site>` to turn a client's design into a reusable one. Afterwards, replace client names, copy, images and colours with placeholders, and add a row above.
- Use one: `../scripts/new-site.sh <slug> <template>`.

Each template should keep `src/lib/api.ts` and the `data-*` hooks its scripts use, so a new site works with Folio immediately.
