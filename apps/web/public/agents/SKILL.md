---
name: seedance-api
description: Generate videos and images using SeedDance and Seedream models via the Seedance API. Use when the user wants to create AI video, animate images, generate images, or work with ByteDance Seed models.
---

# Seedance API

## MCP Server

Connect to `https://api.seedanceapi.us/mcp` with Bearer auth.

```json
{
  "mcpServers": {
    "seedance": {
      "url": "https://api.seedanceapi.us/mcp",
      "headers": { "Authorization": "Bearer YOUR_API_KEY" }
    }
  }
}
```

## Tools

| Tool | Description |
|------|-------------|
| `list_models` | List SeedDance/Seedream models with credit costs |
| `generate_video` | Submit async video generation (returns generation ID) |
| `generate_image` | Generate image synchronously |
| `get_generation` | Poll generation status and get output URL |

## REST API

Base URL: `https://api.seedanceapi.us`

- `GET /v1/models` — list models
- `POST /v1/videos` — async video (202)
- `POST /v1/images` — sync image (200)
- `GET /v1/generations/:id` — poll status
- `GET /v1/credits` — check balance

## Key models

- `seedance-2.5/text-to-video` — latest (served via 2.0)
- `seedance-2.0/text-to-video` — cinematic T2V
- `seedance-2.0-fast/text-to-video` — fast T2V
- `seedream-5.0/text-to-image` — latest image model
- `seedream-4.0/text-to-image` — budget image model

## Workflow

1. Check credits: `GET /v1/credits`
2. Submit video: `POST /v1/videos` → get `id`
3. Poll: `GET /v1/generations/{id}` until `completed`
4. Use `output_url` from response

For images, `POST /v1/images` returns `output_urls` immediately.

## Auth

`Authorization: Bearer ak_...` (user API key from https://seedanceapi.us/dashboard)

## Credits

Prepaid credits. Buy at https://seedanceapi.us/pricing
