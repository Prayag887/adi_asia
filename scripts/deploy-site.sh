#!/bin/sh
# Build a client site and upload it to the server. Static files only; no restart needed.
#   ./scripts/deploy-site.sh adi
# Env: DEPLOY_HOST (default root@163.223.98.6), DEPLOY_PORT (default 41447)
set -eu
slug="${1:?usage: deploy-site.sh <slug>}"
root="$(cd "$(dirname "$0")/.." && pwd)"
site="$root/sites/$slug"
[ -d "$site" ] || { echo "no such site: sites/$slug" >&2; exit 1; }
host="${DEPLOY_HOST:-root@163.223.98.6}"
port="${DEPLOY_PORT:-41447}"

cd "$site"
[ -d node_modules ] || npm ci
npm run build
rsync -az --delete -e "ssh -p $port" dist/ "$host:/srv/sites/tenants/$slug/"
ssh -p "$port" "$host" "chown -R 65532:65532 /srv/sites/tenants/$slug"
echo "Deployed sites/$slug -> /srv/sites/tenants/$slug"
