---
name: seedance-api
description: Generate videos and images using SeedDance and Seedream models via SeedanceAPI. Use when the user wants to create AI video, animate images, or generate images.
---

# SeedanceAPI

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
| `list_models` | List models with prices (`price_usd`, `price_unit`) |
| `generate_video` | Submit async video generation (returns generation ID) |
| `generate_image` | Generate image synchronously |
| `get_generation` | Poll generation status and get output URL |

## REST API

Base URL: `https://api.seedanceapi.us`

- `GET /v1/models` — list models
- `POST /v1/media/upload` — upload inputs for `image_url` / `video_url`
- `POST /v1/videos` — async video (202), billed per second
- `POST /v1/images` — sync image (200), billed per generation
- `GET /v1/generations/:id` — poll status
- `GET /v1/credits` — check balance (`balance_usd`)

## Key models

- `seedance-2.5/text-to-video` — latest cinematic T2V
- `seedance-2.0/text-to-video` — cinematic T2V
- `seedance-2.0-fast/text-to-video` — fast T2V
- `seedream-5.0/text-to-image` — latest image model
- `seedream-4.0/text-to-image` — budget image model

## Workflow

1. Check balance: `GET /v1/credits`
2. Optional: upload media via `POST /v1/media/upload`
3. Submit video: `POST /v1/videos` → get `id`
4. Poll: `GET /v1/generations/{id}` until `completed`
5. Use `output_url` from response

For images, `POST /v1/images` returns `output_urls` immediately.

## Auth

`Authorization: Bearer ak_...` (API key from https://seedanceapi.us/dashboard)

## Billing

Prepaid USD balance. Video is per second; images per generation. Buy at https://seedanceapi.us/pricing
