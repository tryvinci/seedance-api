import { listModels, modelToPublic, CREDIT_PACKS } from "@seedance/models";

export async function GET() {
  const models = listModels();

  const content = `# Seedance API — Full Reference
> Complete model catalog and API reference for LLM agents.

## API
- Base URL: https://api.seedanceapi.us
- OpenAPI: https://api.seedanceapi.us/openapi.json
- MCP: https://api.seedanceapi.us/mcp
- Health: https://api.seedanceapi.us/health

## Authentication
\`\`\`
Authorization: Bearer ak_YOUR_API_KEY
\`\`\`

## Credit packs
${CREDIT_PACKS.map((p) => `- ${p.name}: ${p.credits} credits for $${p.priceUsd}`).join("\n")}

## All models (${models.length} total)

${models
  .map((m) => {
    const pub = modelToPublic(m);
    return `### ${pub.id}
- Display: ${pub.display_name}
- Kind: ${pub.kind}
- Variant: ${pub.variant}
- Credits: ${pub.credits}
- Family: ${pub.family}
${pub.alias_of ? `- Alias of: ${pub.alias_of}` : ""}
- ${pub.description}`;
  })
  .join("\n\n")}

## Video generation
\`\`\`bash
curl -X POST https://api.seedanceapi.us/v1/videos \\
  -H "Authorization: Bearer $API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"model":"seedance-2.5/text-to-video","prompt":"...","aspect_ratio":"16:9","resolution":"720p","duration":5}'
\`\`\`

## Image generation
\`\`\`bash
curl -X POST https://api.seedanceapi.us/v1/images \\
  -H "Authorization: Bearer $API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"model":"seedream-5.0/text-to-image","prompt":"...","size":"2K"}'
\`\`\`

## MCP configuration
\`\`\`json
{
  "mcpServers": {
    "seedance": {
      "url": "https://api.seedanceapi.us/mcp",
      "headers": { "Authorization": "Bearer YOUR_API_KEY" }
    }
  }
}
\`\`\`
`;

  return new Response(content, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
