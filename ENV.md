# Environment files

All secret files are gitignored. Copy from the `.example` templates.

## Web app (`apps/web`)

| File | Purpose |
|------|---------|
| `.env.local.example` → `.env.local` | Local `pnpm dev:web` |
| `.env.production.example` → `.env.production` | Prod values (copy to Cloudflare / wrangler) |

Next.js loads `.env.local` automatically in development.

## API Worker (`apps/api`)

| File | Purpose |
|------|---------|
| `.dev.vars.example` → `.dev.vars` | Local `pnpm dev:api` (Wrangler) |
| `.dev.vars.production.example` → `.dev.vars.production` | Prod secrets for `wrangler secret bulk` |

## Dummy webhook secrets (local dev only)

When `NODE_ENV` is not `production`, these skip signature verification:

| Variable | Dev value |
|----------|-----------|
| `CLERK_WEBHOOK_SECRET` | `whsec_dev_dummy` |
| `DODO_WEBHOOK_SECRET` | `dodo_dev_dummy` |

Test Clerk wallet provisioning locally:

```bash
curl -X POST http://localhost:3000/api/webhooks/clerk \
  -H "Content-Type: application/json" \
  -d '{"type":"user.created","data":{"id":"user_test123"}}'
```

Set `WEBHOOK_VERIFY=true` in `.env.local` to require real signatures (e.g. with ngrok + Clerk dashboard webhook).

## Production webhook URLs

| Provider | URL |
|----------|-----|
| Clerk | `https://seedanceapi.us/api/webhooks/clerk` |
| Dodo | `https://seedanceapi.us/api/webhooks/dodo` |

Replace dummy secrets with real `whsec_...` (Clerk) and Dodo signing secrets in production.

## Push secrets to Cloudflare

```bash
# API Worker
cd apps/api
npx wrangler secret bulk .dev.vars.production

# Web Worker — set individually (NEXT_PUBLIC_* goes in wrangler vars, not secrets)
cd apps/web
npx wrangler secret put CLERK_SECRET_KEY
npx wrangler secret put CLERK_WEBHOOK_SECRET
npx wrangler secret put DODO_PAYMENTS_API_KEY
npx wrangler secret put DODO_WEBHOOK_SECRET
```

`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `NEXT_PUBLIC_APP_URL` belong in `wrangler.jsonc` `vars` or Cloudflare dashboard **Variables** (not secrets).
