import { listModels, listFamilies } from "@seedance/models";

export async function GET() {
  const models = listModels();
  const families = listFamilies();

  const content = `# SeedanceAPI
> REST API for SeedDance video and Seedream image generation.

## About
SeedanceAPI is a pay-as-you-go API for SeedDance (video) and Seedream (image) models.
Authenticate with an API key, upload media when needed, and generate video or images.
Billing is prepaid USD: video per second, images per generation.

## Overview
- Website: https://seedanceapi.us
- API: https://api.seedanceapi.us
- OpenAPI: https://api.seedanceapi.us/openapi.json
- MCP: https://api.seedanceapi.us/mcp
- Docs: https://seedanceapi.us/docs
- Pricing: https://seedanceapi.us/pricing
- Models: https://seedanceapi.us/models
- For Agents: https://seedanceapi.us/agents
- Sitemap: https://seedanceapi.us/sitemap.xml


## Authentication
\`Authorization: Bearer ak_...\` (API key from the dashboard)

## Key endpoints
- GET /v1/models — list all models
- POST /v1/media/upload — upload inputs for image_url / video_url
- POST /v1/videos — async video generation (billed per second)
- POST /v1/images — sync image generation (billed per generation)
- GET /v1/generations/:id — poll generation status
- GET /v1/credits — check balance (USD)

## Model families
${families.map((f) => `- ${f}`).join("\n")}

## Popular models
${models
  .filter((m) =>
    ["seedance-2.5", "seedance-2.0", "seedream-5.0", "seedream-4.0"].some(
      (f) => m.family === f,
    ),
  )
  .slice(0, 10)
  .map(
    (m) =>
      `- ${m.id} ($${m.priceUsd.toFixed(2)}/${m.priceUnit === "second" ? "sec" : "gen"}) — ${m.description}`,
  )
  .join("\n")}

## MCP tools
- list_models
- generate_video
- generate_image
- get_generation

## Full docs
- Quickstart: https://seedanceapi.us/docs/quickstart
- Authentication: https://seedanceapi.us/docs/authentication
- Full model list: https://seedanceapi.us/llms-full.txt
`;

  return new Response(content, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
