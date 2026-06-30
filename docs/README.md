# Mintlify documentation

Documentation for Seedance API, hosted on [Mintlify](https://mintlify.com) at **docs.seedanceapi.us**.

## Local preview

```bash
pnpm install
pnpm dev:docs
```

Opens at http://localhost:3333

## Deploy

1. Push this repo to GitHub
2. Connect the repo in [Mintlify Dashboard](https://dashboard.mintlify.com)
3. Set the **docs directory** to `/docs`
4. Add custom domain `docs.seedanceapi.us` (CNAME to Mintlify)

## Structure

```
docs/
  docs.json          # Mintlify config (navigation, theme, OpenAPI)
  introduction.mdx
  quickstart.mdx
  ...
  api-reference/
    introduction.mdx
```

OpenAPI is loaded from `https://api.seedanceapi.us/openapi.json` for the interactive API reference.
