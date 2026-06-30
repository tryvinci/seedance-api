# Seedance API — Deployment Guide

## Architecture

| App | Domain | Platform |
|-----|--------|----------|
| API Worker | `api.seedanceapi.us` | Cloudflare Workers |
| Website + docs proxy | `seedanceapi.us` | Cloudflare Workers (OpenNext) |
| Docs (Mintlify) | `seedanceapi.us/docs` | Mintlify, proxied by web worker |

## Prerequisites

- Cloudflare account with both domains configured
- Clerk application (publishable + secret keys, JWT PEM key)
- ModelArk API key (BytePlus)
- WaveSpeed API key (fallback)
- Dodo Payments account (API key + webhook secret)

## 1. Provision Cloudflare resources

```bash
# D1 database (shared between API and web)
cd apps/api
npx wrangler d1 create seedance-db
# Copy database_id into apps/api/wrangler.jsonc and apps/web/wrangler.jsonc

# KV namespace (API only)
npx wrangler kv namespace create CACHE
# Copy id into apps/api/wrangler.jsonc

# R2 bucket (API only)
npx wrangler r2 bucket create seedance-media
```

## 2. Run database migrations

```bash
pnpm db:migrate:local   # local dev
pnpm db:migrate:remote  # production
```

## 3. Set secrets

### API Worker (`apps/api`)

```bash
cd apps/api
npx wrangler secret put CLERK_SECRET_KEY
npx wrangler secret put CLERK_JWT_KEY
npx wrangler secret put MODELARK_API_KEY
npx wrangler secret put WAVESPEED_API_KEY
```

### Web Worker (`apps/web`)

```bash
cd apps/web
npx wrangler secret put CLERK_SECRET_KEY
npx wrangler secret put CLERK_WEBHOOK_SECRET
npx wrangler secret put DODO_PAYMENTS_API_KEY
npx wrangler secret put DODO_WEBHOOK_SECRET
```

## 4. Environment variables

### Web app (`.env.local` for dev)

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...
DODO_PAYMENTS_API_KEY=...
DODO_PAYMENTS_ENV=test
DODO_WEBHOOK_SECRET=...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### API Worker (`.dev.vars` for local dev)

```env
CLERK_SECRET_KEY=sk_test_...
CLERK_JWT_KEY=-----BEGIN PUBLIC KEY-----...
MODELARK_API_KEY=...
WAVESPEED_API_KEY=...
```

## 5. Deploy

```bash
# Install dependencies
pnpm install

# Deploy API
cd apps/api
npx wrangler deploy

# Deploy website
cd apps/web
pnpm build
npx opennextjs-cloudflare build
npx opennextjs-cloudflare deploy
```

## 6. Configure DNS

In Cloudflare dashboard, add custom domains:
- `api.seedanceapi.us` → `seedance-api` worker
- `seedanceapi.us` → `seedance-web` worker

## 7. Configure webhooks

### Clerk webhook
- URL: `https://seedanceapi.us/api/webhooks/clerk`
- Events: `user.created`

### Dodo Payments webhook
- URL: `https://seedanceapi.us/api/webhooks/dodo`
- Events: `payment.succeeded`, `checkout.completed`

## 8. Mintlify docs (subpath)

1. Connect GitHub repo **tryvinci/seedance-api** in [Mintlify Dashboard](https://dashboard.mintlify.com)
2. Docs directory: `docs`
3. Domain settings: subpath `/docs` on `seedanceapi.us`
4. Set `MINTLIFY_DOCS_HOST` in `apps/web/wrangler.jsonc` to your `*.mintlify.app` host
5. Redeploy web worker after Mintlify is connected

See [docs/README.md](./docs/README.md) for details.

## 9. Local development

```bash
# Terminal 1: API
pnpm dev:api

# Terminal 2: Web
pnpm dev:web

# Terminal 3: Mintlify docs (optional)
pnpm dev:docs
```

## Secrets checklist

| Secret | App | Purpose |
|--------|-----|---------|
| `CLERK_SECRET_KEY` | Both | Auth verification |
| `CLERK_JWT_KEY` | API | Networkless JWT verify |
| `CLERK_WEBHOOK_SECRET` | Web | User provisioning |
| `MODELARK_API_KEY` | API | Primary provider |
| `WAVESPEED_API_KEY` | API | Fallback provider |
| `DODO_PAYMENTS_API_KEY` | Web | Credit purchases |
| `DODO_WEBHOOK_SECRET` | Web | Payment verification |
