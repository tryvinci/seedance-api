import { listModels, listFamilies } from "@seedance/models";

export async function GET() {
  const models = listModels();
  const families = listFamilies();

  const content = `# Seedance API
> REST API for SeedDance video and Seedream image generation models by ByteDance.

## Overview
- Website: https://seedanceapi.us
- API: https://api.seedanceapi.us
- OpenAPI: https://api.seedanceapi.us/openapi.json
- MCP: https://api.seedanceapi.us/mcp
- Docs: https://docs.seedanceapi.us
- Pricing: https://seedanceapi.us/pricing
- For Agents: https://seedanceapi.us/agents

## Authentication
Bearer token with Clerk API key: \`Authorization: Bearer ak_...\`

## Key endpoints
- GET /v1/models — list all models
- POST /v1/videos — async video generation
- POST /v1/images — sync image generation
- GET /v1/generations/:id — poll generation status
- GET /v1/credits — check credit balance

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
  .map((m) => `- ${m.id} (${m.credits} credits) — ${m.description}`)
  .join("\n")}

## MCP tools
- list_models
- generate_video
- generate_image
- get_generation

## Full docs
- Quickstart: https://docs.seedanceapi.us/quickstart
- Authentication: https://docs.seedanceapi.us/authentication
- Full model list: https://seedanceapi.us/llms-full.txt
`;

  return new Response(content, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
