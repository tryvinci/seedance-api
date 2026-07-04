# Documentation

Docs live at **https://seedanceapi.us/docs** (subpath on the main domain), proxied by the Cloudflare worker in `apps/web/worker.js`.

## Local preview

```bash
pnpm dev:docs   # http://localhost:3333
```

Set in `apps/web/.env.local`:

```env
NEXT_PUBLIC_DOCS_URL=http://localhost:3333
```

## Deploy

Docs build from the `docs/` directory on `main`. The web worker proxies `/docs/*` to the hosted docs site with `X-Forwarded-Host: seedanceapi.us`.

OpenAPI reference uses `docs/openapi.json` (synced from `https://api.seedanceapi.us/openapi.json`).

## Structure

```
docs/
  docs.json
  openapi.json
  introduction.mdx
  quickstart.mdx
  ...
```
