# Seedance API

State-of-the-art REST API for SeedDance video and Seedream image generation models.

## Monorepo structure

```
apps/
  api/     — Hono Worker at api.seedanceapi.us
  web/     — Next.js site at seedanceapi.us
docs/      — Docs at seedanceapi.us/docs
packages/
  models/     — Model catalog, pricing, OpenAPI spec
  providers/  — Upstream generation clients
  db/         — Drizzle D1 schema and queries
```

## Quick start

```bash
pnpm install
pnpm dev        # API :8787 + web :3000 (applies local DB migrations)
# optional:
pnpm dev:all    # also docs on :3333
pnpm dev:api    # API only
pnpm dev:web    # web only
pnpm dev:docs   # docs only
```

See [DEPLOY.md](./DEPLOY.md) for production deployment.

## Features

- **Models**: SeedDance 2.5, 2.0, 2.0 Fast, 2.0 Mini, 1.5 Pro, 1.0 Pro + Seedream 5.0, 4.5, 4.0
- **Auth**: User API keys (`ak_...`)
- **Billing**: Prepaid USD balance (video per second, images per generation)
- **MCP**: Streamable HTTP MCP server at `/mcp`
- **SEO**: sitemap, robots.txt, llms.txt, llms-full.txt, OpenAPI, JSON-LD
