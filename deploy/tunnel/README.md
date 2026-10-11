# Deploying behind a Cloudflare Tunnel

Use this when the VPS can't give Folio ports 80/443 (another app owns them, or the
provider only forwards certain ports). There are no published ports: `cloudflared`
dials out to Cloudflare, and Cloudflare terminates HTTPS.

Currently live: `asiacan.sollari.app` (ADI) and `folio.sollari.app` (admin) at
`/opt/folio` on 163.223.98.6. Deploy with `scripts/deploy-server.sh` and `scripts/deploy-site.sh <slug>`.

```sh
# once, on the server (host network: Docker's default bridge has no IPv6)
CF="docker run --rm --network host -v /opt/folio/cloudflared:/home/nonroot/.cloudflared:z cloudflare/cloudflared:latest"
$CF tunnel login                      # open the printed URL, pick the zone, Authorize
$CF tunnel create folio
$CF tunnel route dns folio asiacan.sollari.app   # later hosts: see "Adding a site hostname"
$CF tunnel route dns folio folio.sollari.app
mv /opt/folio/cloudflared/cert.pem /root/.cloudflared/   # account-level; keep out of the runtime dir
# write cloudflared/config.yml from config.example.yml, then:
docker compose up -d
```

## Adding a site hostname

On the VPS, as root:

```sh
# 1. DNS: create a proxied CNAME for the host that points at the tunnel. Needs the account cert, which only root can read.
docker run --rm --user 0 --network host -v /root/.cloudflared:/cf:ro,z \
  cloudflare/cloudflared:latest tunnel --origincert /cf/cert.pem route dns folio <host>

# 2. Ingress: add the host to /opt/folio/cloudflared/config.yml, ABOVE the final `- service: http_status:404`
#      - hostname: <host>
#        service: http://folio-web:80

# 3. Reload the tunnel (all Folio sites drop for ~2 seconds while it reconnects)
cd /opt/folio && docker compose restart tunnel
```

4. In the admin, open the site → **Domains**, add `<host>`, then press **Verify DNS**.
   In tunnel mode DNS points at Cloudflare, not the VPS, so `SERVER_IPS` in `/opt/folio/.env` must stay **empty** (it is). Otherwise Verify fails.
5. Check: `curl -sI https://<host>/` should return `200`.

Custom domains outside this Cloudflare account need Cloudflare for SaaS (or the plain Caddy setup in `../`).
