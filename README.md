# Seedance API

State-of-the-art REST API for SeedDance video and Seedream image generation models.

## Monorepo structure

```
apps/
  api/     — Hono Worker at api.seedanceapi.us
  web/     — Next.js site at seedanceapi.us
docs/      — Mintlify docs at seedanceapi.us/docs
packages/
  models/     — Model catalog, pricing, OpenAPI spec
  providers/  — ModelArk + WaveSpeed clients with fallback
  db/         — Drizzle D1 schema and queries
```

## Quick start

```bash
pnpm install
pnpm dev:api   # API on :8787
pnpm dev:web   # Web on :3000
pnpm dev:docs  # Mintlify docs on :3333
```

See [DEPLOY.md](./DEPLOY.md) for production deployment.

## Features

- **Models**: SeedDance 2.5 (alias→2.0), 2.0, 2.0 Fast, 2.0 Mini, 1.5 Pro, 1.0 Pro + Seedream 5.0, 4.5, 4.0
- **Auth**: Clerk API keys
- **Billing**: Prepaid credits via Dodo Payments
- **Providers**: ModelArk primary, WaveSpeed fallback
- **MCP**: Streamable HTTP MCP server at `/mcp`
- **SEO**: sitemap, robots.txt, llms.txt, llms-full.txt, OpenAPI, JSON-LD
