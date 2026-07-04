import { listModels } from "./catalog";

export function buildOpenApiSpec() {
  const models = listModels();
  return {
    openapi: "3.1.0",
    info: {
      title: "Seedance API",
      version: "1.0.0",
      description:
        "REST API for SeedDance video and Seedream image generation models.",
    },
    servers: [{ url: "https://api.seedanceapi.us" }],
    paths: {
      "/health": {
        get: {
          summary: "Health check",
          responses: { "200": { description: "OK" } },
        },
      },
      "/v1/models": {
        get: {
          summary: "List available models",
          responses: {
            "200": {
              description: "Model catalog",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      data: {
                        type: "array",
                        items: { $ref: "#/components/schemas/Model" },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      "/v1/videos": {
        post: {
          summary: "Generate a video",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/VideoRequest" },
              },
            },
          },
          responses: {
            "202": { description: "Generation accepted" },
            "401": { description: "Unauthorized" },
            "402": { description: "Insufficient balance" },
          },
        },
      },
      "/v1/images": {
        post: {
          summary: "Generate an image",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ImageRequest" },
              },
            },
          },
          responses: {
            "200": { description: "Image generated" },
            "202": { description: "Generation accepted (async)" },
            "401": { description: "Unauthorized" },
            "402": { description: "Insufficient balance" },
          },
        },
      },
      "/v1/generations/{id}": {
        get: {
          summary: "Get generation status",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
          ],
          responses: {
            "200": { description: "Generation details" },
            "404": { description: "Not found" },
          },
        },
      },
      "/v1/credits": {
        get: {
          summary: "Get account balance",
          security: [{ bearerAuth: [] }],
          responses: {
            "200": { description: "Prepaid balance in USD" },
          },
        },
      },
      "/v1/media/upload": {
        post: {
          summary: "Upload media for generation inputs",
          description:
            "Upload an image or video and receive a URL for image_url / video_url fields.",
          security: [{ bearerAuth: [] }],
          responses: {
            "200": { description: "Uploaded media URL" },
            "400": { description: "Invalid request" },
            "413": { description: "File too large" },
          },
        },
      },
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          description: "API key (ak_...) from your SeedanceAPI dashboard",
        },
      },
      schemas: {
        Model: {
          type: "object",
          properties: {
            id: { type: "string" },
            display_name: { type: "string" },
            family: { type: "string" },
            kind: { type: "string", enum: ["video", "image"] },
            variant: { type: "string" },
            price_usd: { type: "number" },
            price_unit: { type: "string", enum: ["second", "generation"] },
            description: { type: "string" },
          },
        },
        VideoRequest: {
          type: "object",
          required: ["model", "prompt"],
          properties: {
            model: {
              type: "string",
              enum: models.filter((m) => m.kind === "video").map((m) => m.id),
            },
            prompt: { type: "string" },
            aspect_ratio: { type: "string", default: "16:9" },
            resolution: { type: "string", default: "720p" },
            duration: { type: "integer", default: 5 },
            image_url: { type: "string", format: "uri" },
            video_url: { type: "string", format: "uri" },
            generate_audio: { type: "boolean", default: false },
          },
        },
        ImageRequest: {
          type: "object",
          required: ["model", "prompt"],
          properties: {
            model: {
              type: "string",
              enum: models.filter((m) => m.kind === "image").map((m) => m.id),
            },
            prompt: { type: "string" },
            size: { type: "string", default: "2K" },
            image: {
              oneOf: [
                { type: "string", format: "uri" },
                { type: "array", items: { type: "string", format: "uri" } },
              ],
            },
          },
        },
        Generation: {
          type: "object",
          properties: {
            id: { type: "string" },
            status: {
              type: "string",
              enum: ["pending", "processing", "completed", "failed"],
            },
            model: { type: "string" },
            output_url: { type: "string", nullable: true },
            price_usd: { type: "number" },
            error: { type: "string", nullable: true },
          },
        },
      },
    },
  };
}

export function modelToPublic(model: {
  id: string;
  displayName: string;
  family: string;
  kind: string;
  variant: string;
  priceUsd: number;
  priceUnit: "second" | "generation";
  description: string;
}) {
  return {
    id: model.id,
    display_name: model.displayName,
    family: model.family,
    kind: model.kind,
    variant: model.variant,
    price_usd: model.priceUsd,
    price_unit: model.priceUnit,
    description: model.description,
  };
}
