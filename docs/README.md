# Mintlify documentation

Docs live at **https://seedanceapi.us/docs** (subpath on the main domain), proxied from Mintlify via the Cloudflare worker in `apps/web/worker.js`.

## Local preview

```bash
pnpm dev:docs   # http://localhost:3333
```

Set in `apps/web/.env.local`:

```env
NEXT_PUBLIC_DOCS_URL=http://localhost:3333
```

## Deploy (Mintlify + subpath)

1. Connect **tryvinci/seedance-api** in [Mintlify Dashboard](https://dashboard.mintlify.com)
2. Set docs directory to **`docs`**
3. Under **Settings → Domain**, configure a **subpath** deployment:
   - Domain: `seedanceapi.us`
   - Path: `/docs`
4. Note your Mintlify host (e.g. `seedance-api.mintlify.app`) and set it in `apps/web/wrangler.jsonc`:

```jsonc
"MINTLIFY_DOCS_HOST": "seedance-api.mintlify.app"
```

5. Deploy the web worker — `worker.js` proxies `/docs/*` to Mintlify with `X-Forwarded-Host: seedanceapi.us`

No separate `docs.seedanceapi.us` DNS record is needed.

## Structure

```
docs/
  docs.json
  introduction.mdx
  quickstart.mdx
  ...
```

OpenAPI reference loads from `https://api.seedanceapi.us/openapi.json`.
