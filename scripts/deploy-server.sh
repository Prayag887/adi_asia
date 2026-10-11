#!/bin/sh
# Rebuild and restart the Folio server (Rust API + admin) on the VPS.
# Sites keep serving from disk during the restart; the API is down for a few seconds.
#   ./scripts/deploy-server.sh
set -eu
root="$(cd "$(dirname "$0")/.." && pwd)"
host="${DEPLOY_HOST:-root@163.223.98.6}"
port="${DEPLOY_PORT:-41447}"

rsync -az --delete --exclude target --exclude data -e "ssh -p $port" "$root/server/" "$host:/opt/folio/src/"
ssh -p "$port" "$host" 'cd /opt/folio/src && docker build -t folio:latest . && cd /opt/folio && docker compose up -d --force-recreate folio-api && docker image prune -f >/dev/null'
echo "Server deployed."
