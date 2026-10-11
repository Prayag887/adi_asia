---
name: add-domain
description: Give a Folio client site a public hostname (e.g. <client>.sollari.app or a client's own domain) on the live VPS via the Cloudflare Tunnel, and register it in the admin. Use when the user wants a site reachable at a URL, to add/change a domain, or to move a client's domain to Folio.
---

# Add a hostname to a site

Live setup: Cloudflare Tunnel `folio` on VPS 163.223.98.6 (SSH port 41447, root). Full reference: `deploy/tunnel/README.md`. **Confirm with the user before running anything on the VPS or touching DNS.** Never touch door2door (its containers, network, Caddy config or ports 80/443).

## Decide which case it is

- **Subdomain of a zone in the tunnel's Cloudflare account** (e.g. `acme.sollari.app`): use the steps below.
- **Client's own domain in a different Cloudflare account, or not on Cloudflare**: the tunnel can only create DNS in its own account. Options:
  1. Add the zone to this account.
  2. Run `cloudflared tunnel login` again for that account (the user clicks Authorize) and create a second tunnel there.
  3. Use Cloudflare for SaaS.
  Explain these and let the user choose.
- **Moving a live domain** (e.g. asiacan.org from Hostinger): check its MX/TXT records first and leave them untouched, so email keeps working. Note the old A record so the user can roll back. Get explicit approval; the user has said not to move asiacan.org yet.

## Steps (subdomain in the tunnel's account)

On the VPS (`ssh -p 41447 root@163.223.98.6`):

1. Check that `/opt/folio/.env` has an empty `SERVER_IPS=` (it does as of 2026-10-11). If it has an IP, the admin's "Verify DNS" fails in tunnel mode.
2. Create the DNS record:
   ```sh
   docker run --rm --user 0 --network host -v /root/.cloudflared:/cf:ro,z \
     cloudflare/cloudflared:latest tunnel --origincert /cf/cert.pem route dns folio <host>
   ```
   If the record already exists, stop and ask; don't overwrite it.
3. Add an ingress rule to `/opt/folio/cloudflared/config.yml`, **above** the final `- service: http_status:404`:
   ```yaml
     - hostname: <host>
       service: http://folio-web:80
   ```
   Back the file up first (`cp config.yml config.yml.bak-$(date +%F)`).
4. Run `cd /opt/folio && docker compose restart tunnel`. All Folio sites drop for about 2 seconds.
5. In https://folio.sollari.app/admin, open the site → **Domains**, add `<host>`, then press **Verify DNS**. The first verified custom domain becomes primary automatically.
6. Make sure the site's build is deployed (`./scripts/deploy-site.sh <slug>`). Otherwise visitors get a 404.

## Verify

- `curl -sI https://<host>/` should return `200` (your machine's DNS cache may lag; `dig +short <host>` should show Cloudflare IPs).
- The page title matches the site, and `https://<host>/api/posts` returns JSON.
- door2door still answers: `curl -s -o /dev/null -w "%{http_code}" https://door2door.sollari.app/`.
