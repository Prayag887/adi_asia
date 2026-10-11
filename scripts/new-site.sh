#!/bin/sh
# Create a client site from a template.
#
#   ./scripts/new-site.sh <slug> [template]     e.g.  ./scripts/new-site.sh acme
#                                                     ./scripts/new-site.sh acme basic
#
# <slug>      lowercase letters/digits. Must match the slug you give the site in the admin.
# [template]  folder name under templates/ (default: basic). List them with: ls templates
set -eu
slug="${1:?usage: new-site.sh <slug> [template]}"
template="${2:-basic}"
case "$slug" in *[!a-z0-9]*|?) echo "slug must be 2+ lowercase letters/digits" >&2; exit 1 ;; esac

root="$(cd "$(dirname "$0")/.." && pwd)"
src="$root/templates/$template"
dest="$root/sites/$slug"
[ -d "$src" ] || { echo "no template '$template'. Available: $(ls "$root/templates" | tr '\n' ' ')" >&2; exit 1; }
[ -e "$dest" ] && { echo "sites/$slug already exists" >&2; exit 1; }

rsync -a --exclude node_modules --exclude dist --exclude .astro --exclude .env "$src/" "$dest/"
node "$root/scripts/lib-set-name.js" "$dest" "site-$slug"
sed -i.bak "s/$template\.localhost/$slug.localhost/" "$dest/astro.config.mjs" "$dest/.env.example"
find "$dest" -name '*.bak' -delete
cp "$dest/.env.example" "$dest/.env"

echo "Created sites/$slug from templates/$template."
echo "Next:"
echo "  cd sites/$slug && npm install && npm start"
echo "  Admin -> New site with slug '$slug', add its domain and an editor."
echo "  Deploy: ./scripts/deploy-site.sh $slug"
