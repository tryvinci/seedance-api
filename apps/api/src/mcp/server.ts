import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { z } from "zod";
import {
  listModels,
  modelToPublic,
} from "@seedance/models";
import type { Env } from "../env";
import { getDb } from "../lib/utils";
import { createClerkClient } from "@clerk/backend";

export async function handleMcp(request: Request, env: Env): Promise<Response> {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const clerk = createClerkClient({
    secretKey: env.CLERK_SECRET_KEY,
    jwtKey: env.CLERK_JWT_KEY,
  });
  const state = await clerk.authenticateRequest(request, {
    authorizedParties: [env.AUTHORIZED_PARTIES],
    acceptsToken: ["api_key"],
  });
  if (!state.isAuthenticated) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
  const authObj = state.toAuth();
  const ownerId = authObj.userId ?? authObj.orgId;
  if (!ownerId) {
    return new Response(JSON.stringify({ error: "No identity" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const server = new McpServer({
    name: "seedance-api",
    version: "1.0.0",
  });

  server.tool(
    "list_models",
    "List available SeedDance and Seedream models",
    {
      kind: z.string().optional().describe("Filter: video or image"),
      family: z.string().optional().describe("Filter by family e.g. seedance-2.0"),
    },
    async ({ kind, family }) => {
      const models = listModels({
        kind: kind as "video" | "image" | undefined,
        family,
      });
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(models.map(modelToPublic), null, 2),
          },
        ],
      };
    },
  );

  server.tool(
    "generate_video",
    "Submit a video generation job",
    {
      model: z.string().describe("Model ID e.g. seedance-2.0/text-to-video"),
      prompt: z.string().describe("Text prompt"),
      aspect_ratio: z.string().optional().describe("Aspect ratio, default 16:9"),
      resolution: z.string().optional().describe("Resolution, default 720p"),
      duration: z.number().optional().describe("Duration in seconds, default 5"),
      image_url: z.string().optional().describe("Reference image URL for i2v"),
    },
    async (args) => {
      const res = await fetch("https://api.seedanceapi.us/v1/videos", {
        method: "POST",
        headers: {
          Authorization: authHeader,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(args),
      });
      const data = await res.json();
      return {
        content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
      };
    },
  );

  server.tool(
    "generate_image",
    "Generate an image",
    {
      model: z.string().describe("Model ID e.g. seedream-5.0/text-to-image"),
      prompt: z.string().describe("Text prompt"),
      size: z.string().optional().describe("Size: 1K, 2K, 3K, 4K"),
    },
    async (args) => {
      const res = await fetch("https://api.seedanceapi.us/v1/images", {
        method: "POST",
        headers: {
          Authorization: authHeader,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(args),
      });
      const data = await res.json();
      return {
        content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
      };
    },
  );

  server.tool(
    "get_generation",
    "Get the status of a generation job",
    {
      id: z.string().describe("Generation ID"),
    },
    async ({ id }) => {
      const db = getDb(env);
      const { getGeneration } = await import("@seedance/db");
      const gen = await getGeneration(db, id, ownerId);
      if (!gen) {
        return {
          content: [{ type: "text" as const, text: JSON.stringify({ error: "Not found" }) }],
        };
      }
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                id: gen.id,
                status: gen.status,
                model: gen.canonicalModel,
                output_url: gen.outputUrl,
                price_usd: Math.round(gen.creditsCost) / 100,
                error: gen.error,
              },
              null,
              2,
            ),
          },
        ],
      };
    },
  );

  const transport = new WebStandardStreamableHTTPServerTransport();
  await server.connect(transport);
  return transport.handleRequest(request);
}
