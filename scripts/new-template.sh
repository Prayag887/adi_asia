#!/bin/sh
# Create a reusable design template.
#
#   ./scripts/new-template.sh <name>                 copy of templates/basic
#   ./scripts/new-template.sh <name> --from <site>   copy of an existing client site (e.g. adi)
#   ./scripts/new-template.sh <name> --from-template <other>
#
# Templates live in templates/<name>. New sites are created from them with
#   ./scripts/new-site.sh <slug> <name>
set -eu
name="${1:?usage: new-template.sh <name> [--from <site> | --from-template <template>]}"
case "$name" in *[!a-z0-9-]*|?) echo "name must be 2+ lowercase letters/digits/dashes" >&2; exit 1 ;; esac
root="$(cd "$(dirname "$0")/.." && pwd)"
dest="$root/templates/$name"
[ -e "$dest" ] && { echo "templates/$name already exists" >&2; exit 1; }

case "${2:-}" in
  --from)          src="$root/sites/${3:?--from needs a site slug}"; oldhost="${3}" ;;
  --from-template) src="$root/templates/${3:?--from-template needs a template name}"; oldhost="${3}" ;;
  "")              src="$root/templates/basic"; oldhost="basic" ;;
  *)               echo "unknown option ${2}" >&2; exit 1 ;;
esac
[ -d "$src" ] || { echo "not found: $src" >&2; exit 1; }

rsync -a --exclude node_modules --exclude dist --exclude .astro --exclude .env "$src/" "$dest/"
node "$root/scripts/lib-set-name.js" "$dest" "template-$name"
sed -i.bak "s/'$oldhost\.localhost'/'$name.localhost'/; s/=$oldhost\.localhost/=$name.localhost/" "$dest/astro.config.mjs" "$dest/.env.example"
find "$dest" -name '*.bak' -delete

echo "Created templates/$name from ${src#$root/}."
echo "Now make it generic: replace client names, copy, images and brand colours with placeholders."
echo "Use it with: ./scripts/new-site.sh <slug> $name"
