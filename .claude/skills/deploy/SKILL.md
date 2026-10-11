---
name: deploy
description: Deploy a Folio client site and/or the Folio Rust server to the live VPS safely, with pre-deploy checks, a database backup, and post-deploy verification. Use when the user asks to deploy, ship, publish, or put changes live.
---

# Deploy

Target: VPS 163.223.98.6, SSH port 41447, root, everything under `/opt/folio`. **Get the user's go-ahead first.** Never touch door2door.

The scripts read `DEPLOY_HOST` (default `root@163.223.98.6`) and `DEPLOY_PORT` (default `41447`). They need SSH key access. If you only have password access, add a temporary key, use it, and remove it from `~/.ssh/authorized_keys` afterwards.

## 1. Check before deploying (all must pass)

**Site** (`sites/<slug>`):
```sh
cd sites/<slug> && npm run lint && npm run build      # build includes `astro check`
```
- Run it locally against the server and click through: page renders, sign-in → edit mode, blog, contact form.
- For **adi**, also confirm nothing changed visually: compare before/after screenshots at 1440px and 390px. It must stay pixel-identical unless the user asked for a visual change.

**Server** (`server/`):
```sh
cd server && cargo test && cargo clippy -- -D warnings && docker build -t folio:check . && docker rmi folio:check
```

## 2. Deploy

**Site:**
```sh
./scripts/deploy-site.sh <slug>     # builds, then rsyncs dist/ to /srv/sites/tenants/<slug>/
```
Static only: no restart, no downtime.

**Server:** back up the database first:
```sh
ssh -p 41447 root@163.223.98.6 'docker run --rm -v /srv/folio/data:/data:z alpine:3 sh -c \
  "apk add -q sqlite && sqlite3 /data/folio.db \".backup /data/folio.db.bak-$(date +%Y%m%d-%H%M)\""'
./scripts/deploy-server.sh          # rebuilds the image on the VPS, recreates only folio-api (~3s API downtime)
```
Then confirm the API container really runs the new image:
```sh
ssh -p 41447 root@163.223.98.6 'docker image inspect -f "{{.Id}}" folio:latest; docker inspect -f "{{.Image}}" folio-folio-api-1'
```
The two IDs must match. (Without `--force-recreate`, which the script already passes, Compose silently keeps the old container.)

## 3. Verify live

```sh
for u in https://<host>/ https://<host>/api/posts https://folio.sollari.app/admin/login; do curl -s -o /dev/null -w "%{http_code} $u\n" $u; done
curl -s -o /dev/null -w "door2door %{http_code}\n" https://door2door.sollari.app/
ssh -p 41447 root@163.223.98.6 'cd /opt/folio && docker compose ps && docker compose logs --tail 20 folio-api'
```
- Expect 200s, three services running, and no errors in the logs.
- For a site deploy, the live HTML differs from `dist/index.html` only by Cloudflare's email obfuscation.
- Sign in on the live site in a real browser.

## Rollback

- **Site:** `git checkout <previous-commit> -- sites/<slug>` and redeploy it.
- **Server:** redeploy the previous commit with `deploy-server.sh`. If a migration broke data, restore `folio.db.bak-*`: stop `folio-api`, copy the backup over `folio.db`, delete `folio.db-wal` and `folio.db-shm`, then start it again.
