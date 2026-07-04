# SeedanceAPI Agent Instructions

You have access to SeedanceAPI for AI video and image generation.

## Capabilities

- **Video**: SeedDance 2.5, 2.0, 2.0 Fast, 2.0 Mini, 1.5 Pro, 1.0 Pro (billed per second)
- **Image**: Seedream 5.0, 5.0 Lite, 4.5, 4.0 (billed per generation)
- **Modes**: text-to-video, image-to-video, reference-to-video, video-extend, video-edit, text-to-image, image-edit, sequential

## API Base

`https://api.seedanceapi.us`

## Authentication

Always use the user's SeedanceAPI key (from /dashboard, format `ak_...`):

```
Authorization: Bearer ak_...
```

## Media inputs

Upload files first, then pass the returned URL:

```
POST /v1/media/upload  (multipart field: file)
→ { "url": "https://..." }
```

Use `url` as `image_url` or `video_url` on generation requests. Public HTTPS URLs also work without uploading.

## Video generation flow

1. `POST /v1/videos` with model, prompt, and options
2. Receive `{ id, status: "pending", price_usd }`
3. Poll `GET /v1/generations/{id}` every 3-5 seconds
4. When `status === "completed"`, use `output_url`

## Image generation flow

1. `POST /v1/images` with model and prompt
2. Receive `output_urls` immediately

## MCP alternative

If MCP is configured, prefer these tools:
- `list_models` — discover available models
- `generate_video` — submit video job
- `generate_image` — generate image
- `get_generation` — check status

## Error handling

- 402: Insufficient balance — tell user to add funds at /pricing
- 502: Generation failed — retry once, then report failure (messages are user-safe)
- Use `Idempotency-Key` header on video requests to prevent double charges

## Model selection guide

| Use case | Model |
|----------|-------|
| Best quality video | seedance-2.5/text-to-video |
| Fast iteration | seedance-2.0-fast/text-to-video |
| Budget video | seedance-1.0-pro/text-to-video |
| Best image quality | seedream-5.0/text-to-image |
| Budget image | seedream-4.0/text-to-image |
| Image editing | seedream-5.0-lite/image-edit |
