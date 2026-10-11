# deploy/

How Folio runs on a server. Pick **one** setup.

| Setup | Use when | Status |
|---|---|---|
| [`tunnel/`](tunnel/) | Another app already owns ports 80/443, or the provider only forwards some ports. Traffic comes in through a Cloudflare Tunnel, and no ports are opened. | **Live** on 163.223.98.6 (`/opt/folio`) |
| [`caddy/`](caddy/) | Folio has the server to itself. Caddy owns 80/443 and issues HTTPS automatically for any client domain (on-demand TLS). | Not used yet |

Day-to-day deploys don't need these files. Use `scripts/deploy-site.sh` and `scripts/deploy-server.sh`.
