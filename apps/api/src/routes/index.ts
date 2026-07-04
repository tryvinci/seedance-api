import { Hono } from "hono";
import {
  listModels,
  resolveModel,
  modelToPublic,
  buildOpenApiSpec,
  videoParamsSchema,
  imageParamsSchema,
} from "@seedance/models";
import {
  getWalletBalance,
  holdCredits,
  createGeneration,
  getGeneration,
  listGenerations,
} from "@seedance/db";
import {
  submitVideoWithFallback,
  generateImageWithFallback,
} from "@seedance/providers";
import type { Env, AuthContext } from "../env";
import type { AppVariables } from "../middleware/auth";
import { authMiddleware } from "../middleware/auth";
import {
  getDb,
  checkIdempotency,
  setIdempotency,
  copyToR2,
  publicMediaUrl,
} from "../lib/utils";
import type { PollParams } from "../workflows/poll-generation";

type AppEnv = { Bindings: Env; Variables: AppVariables };

const app = new Hono<AppEnv>();

app.use("*", async (c, next) => {
  c.header("Access-Control-Allow-Origin", "*");
  c.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  c.header(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, Idempotency-Key",
  );
  if (c.req.method === "OPTIONS") return new Response(null, { status: 204 });
  await next();
});

app.get("/health", (c) =>
  c.json({ status: "ok", service: "seedance-api", version: "1.0.0" }),
);

app.get("/openapi.json", (c) => c.json(buildOpenApiSpec()));

app.get("/v1/models", (c) => {
  const kind = c.req.query("kind") as "video" | "image" | undefined;
  const family = c.req.query("family");
  const models = listModels({ kind, family });
  return c.json({ data: models.map(modelToPublic) });
});

app.get("/v1/credits", authMiddleware, async (c) => {
  const { ownerId } = c.get("auth") as AuthContext;
  const db = getDb(c.env);
  const balance = await getWalletBalance(db, ownerId);
  return c.json({ credits: balance });
});

app.get("/v1/generations", authMiddleware, async (c) => {
  const { ownerId } = c.get("auth") as AuthContext;
  const db = getDb(c.env);
  const gens = await listGenerations(db, ownerId);
  return c.json({ data: gens.map(formatGeneration) });
});

app.get("/v1/generations/:id", authMiddleware, async (c) => {
  const { ownerId } = c.get("auth") as AuthContext;
  const db = getDb(c.env);
  const gen = await getGeneration(db, c.req.param("id"), ownerId);
  if (!gen) return c.json({ error: "Not found" }, 404);
  return c.json(formatGeneration(gen));
});

app.post("/v1/videos", authMiddleware, async (c) => {
  const { ownerId } = c.get("auth") as AuthContext;
  const body = await c.req.json();
  const modelId = body.model as string;
  if (!modelId) return c.json({ error: "model is required" }, 400);

  let model;
  try {
    model = resolveModel(modelId);
  } catch {
    return c.json({ error: `Unknown model: ${modelId}` }, 400);
  }
  if (model.kind !== "video") {
    return c.json({ error: "Model is not a video model" }, 400);
  }

  const parsed = videoParamsSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Invalid params", details: parsed.error.flatten() }, 400);
  }

  const idempotencyKey = c.req.header("Idempotency-Key");
  if (idempotencyKey) {
    const existing = await checkIdempotency(c.env.CACHE, idempotencyKey, ownerId);
    if (existing) {
      const db = getDb(c.env);
      const gen = await getGeneration(db, existing, ownerId);
      if (gen) return c.json(formatGeneration(gen), 202);
    }
  }

  const db = getDb(c.env);
  const generationId = crypto.randomUUID();

  try {
    await holdCredits(db, ownerId, model.credits, generationId);
  } catch (e) {
    if (e instanceof Error && e.message === "INSUFFICIENT_CREDITS") {
      return c.json({ error: "Insufficient credits", credits_required: model.credits }, 402);
    }
    throw e;
  }

  const providerConfig = {
    modelarkApiKey: c.env.MODELARK_API_KEY,
    wavespeedApiKey: c.env.WAVESPEED_API_KEY,
    arkBase: c.env.ARK_BASE,
  };

  let provider: "modelark" | "wavespeed";
  let taskId: string;
  try {
    const { result, provider: p } = await submitVideoWithFallback(
      providerConfig,
      modelId,
      parsed.data,
    );
    provider = p;
    taskId = result.taskId;
  } catch (err) {
    const { refundHold } = await import("@seedance/db");
    await refundHold(db, ownerId, generationId, model.credits);
    return c.json(
      { error: "Generation failed", message: "Upstream generation failed" },
      502,
    );
  }

  await createGeneration(db, {
    id: generationId,
    ownerId,
    kind: "video",
    canonicalModel: modelId,
    paramsJson: JSON.stringify(parsed.data),
    creditsCost: model.credits,
    provider,
    providerTaskId: taskId,
    status: "pending",
  });

  if (idempotencyKey) {
    await setIdempotency(c.env.CACHE, idempotencyKey, ownerId, generationId);
  }

  const workflowParams: PollParams = {
    generationId,
    ownerId,
    provider,
    taskId,
    creditsCost: model.credits,
  };
  await c.env.POLL_WORKFLOW.create({ id: generationId, params: workflowParams });

  return c.json(
    formatGeneration({
      id: generationId,
      status: "pending",
      canonicalModel: modelId,
      kind: "video",
      outputUrl: null,
      creditsCost: model.credits,
      error: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }),
    202,
  );
});

app.post("/v1/images", authMiddleware, async (c) => {
  const { ownerId } = c.get("auth") as AuthContext;
  const body = await c.req.json();
  const modelId = body.model as string;
  if (!modelId) return c.json({ error: "model is required" }, 400);

  let model;
  try {
    model = resolveModel(modelId);
  } catch {
    return c.json({ error: `Unknown model: ${modelId}` }, 400);
  }
  if (model.kind !== "image") {
    return c.json({ error: "Model is not an image model" }, 400);
  }

  const parsed = imageParamsSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Invalid params", details: parsed.error.flatten() }, 400);
  }

  const db = getDb(c.env);
  const generationId = crypto.randomUUID();

  try {
    await holdCredits(db, ownerId, model.credits, generationId);
  } catch (e) {
    if (e instanceof Error && e.message === "INSUFFICIENT_CREDITS") {
      return c.json({ error: "Insufficient credits", credits_required: model.credits }, 402);
    }
    throw e;
  }

  const providerConfig = {
    modelarkApiKey: c.env.MODELARK_API_KEY,
    wavespeedApiKey: c.env.WAVESPEED_API_KEY,
    arkBase: c.env.ARK_BASE,
  };

  try {
    const { result, provider } = await generateImageWithFallback(
      providerConfig,
      modelId,
      parsed.data,
    );

    const outputUrls: string[] = [];
    for (let i = 0; i < result.outputUrls.length; i++) {
      const ext = parsed.data.output_format === "png" ? "png" : "jpeg";
      const key = `outputs/${ownerId}/${generationId}-${i}.${ext}`;
      await copyToR2(c.env.MEDIA, result.outputUrls[i], key);
      outputUrls.push(publicMediaUrl(c.env, key));
    }

    const { commitHold } = await import("@seedance/db");
    await createGeneration(db, {
      id: generationId,
      ownerId,
      kind: "image",
      canonicalModel: modelId,
      paramsJson: JSON.stringify(parsed.data),
      creditsCost: model.credits,
      provider,
      status: "completed",
    });
    const { updateGeneration } = await import("@seedance/db");
    await updateGeneration(db, generationId, {
      outputR2Key: `outputs/${ownerId}/${generationId}-0.jpeg`,
      outputUrl: outputUrls[0],
    });
    await commitHold(db, generationId);

    return c.json({
      id: generationId,
      status: "completed",
      model: modelId,
      output_urls: outputUrls,
      credits_cost: model.credits,
    });
  } catch (err) {
    const { refundHold } = await import("@seedance/db");
    await refundHold(db, ownerId, generationId, model.credits);
    return c.json(
      { error: "Generation failed", message: "Upstream generation failed" },
      502,
    );
  }
});

app.get("/v1/media/*", async (c) => {
  const key = c.req.path.replace("/v1/media/", "");
  const obj = await c.env.MEDIA.get(key);
  if (!obj) return c.json({ error: "Not found" }, 404);
  const headers = new Headers();
  obj.writeHttpMetadata(headers);
  headers.set("Cache-Control", "public, max-age=31536000");
  return new Response(obj.body, { headers });
});

function formatGeneration(gen: {
  id: string;
  status: string;
  canonicalModel: string;
  kind: string;
  outputUrl: string | null;
  creditsCost: number;
  error: string | null;
  createdAt: string;
  updatedAt: string;
}) {
  return {
    id: gen.id,
    status: gen.status,
    model: gen.canonicalModel,
    kind: gen.kind,
    output_url: gen.outputUrl,
    credits_cost: gen.creditsCost,
    error: gen.error,
    created_at: gen.createdAt,
    updated_at: gen.updatedAt,
  };
}

export { app };
