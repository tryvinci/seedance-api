#!/usr/bin/env bash
# Expose local web (port 3000) for Dodo test webhooks.
# Use localhost:3000 in the browser; only the webhook URL needs the tunnel.
set -euo pipefail
PORT="${1:-3000}"
echo "Starting Cloudflare quick tunnel → http://localhost:${PORT}"
echo "In Dodo (Test mode) → Developer → Webhooks, set URL to:"
echo "  https://<tunnel-host>/api/webhooks/dodo"
echo "Event: payment.succeeded"
echo "Keep DODO_WEBHOOK_SECRET=dodo_dev_dummy for local (signature bypass)."
echo ""
exec cloudflared tunnel --url "http://localhost:${PORT}"
