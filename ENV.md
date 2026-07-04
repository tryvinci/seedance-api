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

## Dodo Payments (checkout / top-up)

| Variable | Required | Notes |
|----------|----------|-------|
| `DODO_PAYMENTS_API_KEY` | Prod | Dashboard → Developer → API. Test keys only work with `DODO_PAYMENTS_ENV=test`. |
| `DODO_PAYMENTS_ENV` | Prod | `test` or `live` (also accepts `test_mode` / `live_mode`). Defaults to `live` when `NODE_ENV=production`. Set in `wrangler.jsonc` `vars`. |
| `DODO_WEBHOOK_SECRET` | Prod | Dashboard → Developer → Webhooks signing secret (`whsec_...`). Alias: `DODO_PAYMENTS_WEBHOOK_KEY`. |
| `DODO_TOPUP_PRODUCT_ID` | Prod | Single pay-what-you-want product (`pdt_...`). Packs are UI presets; checkout always sends `amount` in cents. |
| `DODO_DEV_CREDIT` | Local only | Set `true` to skip Dodo and credit the wallet even when an API key is present |

Local dev credits the wallet immediately when the API key is empty, the product id is missing, or `DODO_DEV_CREDIT=true`. Set a test API key **and** `DODO_TOPUP_PRODUCT_ID` to exercise real Dodo checkout locally.

Create one pay-what-you-want one-time product in the Dodo dashboard. Webhook URL: `https://seedanceapi.us/api/webhooks/dodo` — subscribe to `payment.succeeded`.

## Push secrets to Cloudflare

```bash
# API Worker
cd apps/api
npx wrangler secret bulk .dev.vars.production

# Web Worker — set individually (non-secret vars go in wrangler.jsonc vars)
cd apps/web
npx wrangler secret put CLERK_SECRET_KEY
npx wrangler secret put CLERK_WEBHOOK_SECRET
npx wrangler secret put DODO_PAYMENTS_API_KEY
npx wrangler secret put DODO_WEBHOOK_SECRET
npx wrangler secret put DODO_TOPUP_PRODUCT_ID
```


`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `NEXT_PUBLIC_APP_URL`, and `DODO_PAYMENTS_ENV` belong in `wrangler.jsonc` `vars` or Cloudflare dashboard **Variables** (not secrets).
