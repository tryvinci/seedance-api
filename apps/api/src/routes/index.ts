import { Hono } from "hono";
import {
  listModels,
  resolveModel,
  modelToPublic,
  isModelRunnable,
  buildOpenApiSpec,
  videoParamsSchema,
  imageParamsSchema,
  creditsToUsd,
} from "@seedance/models";
import { publicErrorPayload } from "../lib/public-error";
import {
  getWalletBalance,
  holdCredits,
  createGeneration,
  getGeneration,
  listGenerations,
  countGenerations,
} from "@seedance/db";
import {
  submitVideoWithFallback,
  generateImageWithFallback,
  quoteGeneration,
} from "@seedance/providers";
import type { Env, AuthContext } from "../env";
import type { AppVariables } from "../middleware/auth";
import { authMiddleware } from "../middleware/auth";
import {
  getDb,
  checkIdempotency,
  setIdempotency,
  checkUploadQuota,
  copyToR2,
  publicMediaUrl,
} from "../lib/utils";
import type { PollParams } from "../workflows/poll-generation";
import { generationEventProps, trackEvent } from "../lib/analytics";

type AppEnv = { Bindings: Env; Variables: AppVariables };

const app = new Hono<AppEnv>();

app.use("*", async (c, next) => {
  c.header("Access-Control-Allow-Origin", "*");
  c.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  c.header(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, Idempotency-Key",
  );
  c.header("Access-Control-Max-Age", "86400");
  // Must use c.body so CORS headers set above are included (bare Response drops them).
  if (c.req.method === "OPTIONS") return c.body(null, 204);
  const started = Date.now();
  try {
    await next();
  } catch (err) {
    console.error("Unhandled API error:", err);
    return c.json(
      {
        error: "Internal error",
        message:
          err instanceof Error ? err.message : "Something went wrong",
      },
      500,
    );
  } finally {
    const path = c.req.path;
    if (path.startsWith("/v1/")) {
      let ownerId: string | undefined;
      try {
        ownerId = (c.get("auth") as AuthContext).ownerId;
      } catch {
        ownerId = undefined;
      }
      trackEvent(
        c.env,
        c.executionCtx?.waitUntil.bind(c.executionCtx),
        ownerId ?? "anonymous",
        "api_request",
        {
          path,
          method: c.req.method,
          status: c.res.status,
          duration_ms: Date.now() - started,
          authenticated: Boolean(ownerId),
        },
      );
    }
  }
});

app.get("/health", (c) =>
  c.json({ status: "ok", service: "seedance-api", version: "1.0.0" }),
);

app.get("/openapi.json", (c) => c.json(buildOpenApiSpec()));

function providerKeys(env: Env) {
  return {
    modelark: Boolean(env.MODELARK_API_KEY?.trim()),
    wavespeed: Boolean(env.WAVESPEED_API_KEY?.trim()),
  };
}

app.get("/v1/models", (c) => {
  const kind = c.req.query("kind") as "video" | "image" | undefined;
  const family = c.req.query("family");
  // Only list models we can actually run with configured provider keys.
  const models = listModels({
    kind,
    family,
    providers: providerKeys(c.env),
  });
  return c.json({ data: models.map(modelToPublic) });
});

app.get("/v1/credits", authMiddleware, async (c) => {
  const { ownerId } = c.get("auth") as AuthContext;
  const db = getDb(c.env);
  const balance = await getWalletBalance(db, ownerId);
  return c.json({ balance_usd: creditsToUsd(balance) });
});

app.post("/v1/quote", authMiddleware, async (c) => {
  const body = await c.req.json();
  const modelId = body.model as string;
  if (!modelId) return c.json({ error: "model is required" }, 400);

  let model;
  try {
    model = resolveModel(modelId);
  } catch {
    return c.json({ error: `Unknown model: ${modelId}` }, 400);
  }
  if (!isModelRunnable(model, providerKeys(c.env))) {
    return c.json(
      {
        error: "Model unavailable",
        message: "This model is not available right now. Pick another from GET /v1/models.",
      },
      503,
    );
  }

  const schema = model.kind === "video" ? videoParamsSchema : imageParamsSchema;
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Invalid params", details: parsed.error.flatten() }, 400);
  }

  try {
    const quote = await quoteGeneration(
      {
        modelarkApiKey: c.env.MODELARK_API_KEY,
        wavespeedApiKey: c.env.WAVESPEED_API_KEY,
        arkBase: c.env.ARK_BASE,
      },
      modelId,
      parsed.data,
      providerKeys(c.env),
    );
    return c.json({
      model: modelId,
      price_unit: model.priceUnit,
      ...publicPriceFields(quote),
    });
  } catch (err) {
    return c.json(
      {
        error: "Pricing unavailable",
        message: err instanceof Error ? err.message : "Could not quote price",
      },
      503,
    );
  }
});

app.get("/v1/generations", authMiddleware, async (c) => {
  const { ownerId } = c.get("auth") as AuthContext;
  const db = getDb(c.env);
  const limitRaw = Number(c.req.query("limit") ?? 25);
  const offsetRaw = Number(c.req.query("offset") ?? 0);
  const limit = [10, 25, 50].includes(limitRaw) ? limitRaw : 25;
  const offset = Number.isFinite(offsetRaw) && offsetRaw > 0 ? Math.floor(offsetRaw) : 0;
  // Outputs are retained ~7 days; only list recent generations.
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const [gens, total] = await Promise.all([
    listGenerations(db, ownerId, { limit, offset, since }),
    countGenerations(db, ownerId, since),
  ]);
  return c.json({
    data: gens.map(formatGeneration),
    total,
    limit,
    offset,
    since,
  });
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
  if (!isModelRunnable(model, providerKeys(c.env))) {
    return c.json(
      {
        error: "Model unavailable",
        message: "This model is not available right now. Pick another from GET /v1/models.",
      },
      503,
    );
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

  const providerConfig = {
    modelarkApiKey: c.env.MODELARK_API_KEY,
    wavespeedApiKey: c.env.WAVESPEED_API_KEY,
    arkBase: c.env.ARK_BASE,
  };

  let quote;
  try {
    quote = await quoteGeneration(
      providerConfig,
      modelId,
      parsed.data,
      providerKeys(c.env),
    );
  } catch (err) {
    return c.json(
      {
        error: "Pricing unavailable",
        message: err instanceof Error ? err.message : "Could not quote price",
      },
      503,
    );
  }

  const costCredits = quote.retailCredits;
  const costUsd = quote.retailUsd;

  try {
    await holdCredits(db, ownerId, costCredits, generationId);
  } catch (e) {
    if (e instanceof Error && e.message === "INSUFFICIENT_CREDITS") {
      return c.json(
        {
          error: "Insufficient balance",
          price_unit: model.priceUnit,
          ...publicPriceFields(quote),
        },
        402,
      );
    }
    throw e;
  }

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
    await refundHold(db, ownerId, generationId, costCredits);
    return c.json(publicErrorPayload(err), 502);
  }

  await createGeneration(db, {
    id: generationId,
    ownerId,
    kind: "video",
    canonicalModel: modelId,
    paramsJson: JSON.stringify(parsed.data),
    creditsCost: costCredits,
    providerCostCredits: quote.providerCostCredits,
    providerModelPath: quote.providerModelPath,
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
    creditsCost: costCredits,
  };
  await c.env.POLL_WORKFLOW.create({ id: generationId, params: workflowParams });

    trackEvent(
      c.env,
      c.executionCtx?.waitUntil.bind(c.executionCtx),
      ownerId,
      "generation_started",
      generationEventProps({
        generationId,
        model: modelId,
        kind: "video",
        provider,
        creditsCost: costCredits,
        providerCostCredits: quote.providerCostCredits,
        duration: parsed.data.duration,
        status: "pending",
      }),
    );

  return c.json(
    formatGeneration({
      id: generationId,
      status: "pending",
      canonicalModel: modelId,
      kind: "video",
      outputUrl: null,
      creditsCost: costCredits,
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
  if (!isModelRunnable(model, providerKeys(c.env))) {
    return c.json(
      {
        error: "Model unavailable",
        message: "This model is not available right now. Pick another from GET /v1/models.",
      },
      503,
    );
  }

  const parsed = imageParamsSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Invalid params", details: parsed.error.flatten() }, 400);
  }

  const db = getDb(c.env);
  const generationId = crypto.randomUUID();

  const providerConfig = {
    modelarkApiKey: c.env.MODELARK_API_KEY,
    wavespeedApiKey: c.env.WAVESPEED_API_KEY,
    arkBase: c.env.ARK_BASE,
  };

  let quote;
  try {
    quote = await quoteGeneration(
      providerConfig,
      modelId,
      parsed.data,
      providerKeys(c.env),
    );
  } catch (err) {
    return c.json(
      {
        error: "Pricing unavailable",
        message: err instanceof Error ? err.message : "Could not quote price",
      },
      503,
    );
  }

  const costCredits = quote.retailCredits;
  const costUsd = quote.retailUsd;

  try {
    await holdCredits(db, ownerId, costCredits, generationId);
  } catch (e) {
    if (e instanceof Error && e.message === "INSUFFICIENT_CREDITS") {
      return c.json(
        {
          error: "Insufficient balance",
          price_unit: model.priceUnit,
          ...publicPriceFields(quote),
        },
        402,
      );
    }
    throw e;
  }

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
      creditsCost: costCredits,
      providerCostCredits: quote.providerCostCredits,
      providerModelPath: quote.providerModelPath,
      provider,
      status: "completed",
    });
    const { updateGeneration } = await import("@seedance/db");
    await updateGeneration(db, generationId, {
      outputR2Key: `outputs/${ownerId}/${generationId}-0.jpeg`,
      outputUrl: outputUrls[0],
    });
    await commitHold(db, generationId);

    trackEvent(
      c.env,
      c.executionCtx?.waitUntil.bind(c.executionCtx),
      ownerId,
      "generation_completed",
      generationEventProps({
        generationId,
        model: modelId,
        kind: "image",
        provider,
        creditsCost: costCredits,
        providerCostCredits: quote.providerCostCredits,
        status: "completed",
      }),
    );

    return c.json({
      id: generationId,
      status: "completed",
      model: modelId,
      output_urls: outputUrls,
      price_usd: costUsd,
      price_unit: model.priceUnit,
    });
  } catch (err) {
    const { refundHold } = await import("@seedance/db");
    await refundHold(db, ownerId, generationId, costCredits);
    return c.json(publicErrorPayload(err), 502);
  }
});

/**
 * Upload media for use as image_url / video_url inputs.
 * Proxies to the upstream media host; response has no provider branding.
 */
app.post("/v1/media/upload", authMiddleware, async (c) => {
  const { ownerId } = c.get("auth") as AuthContext;
  const contentType = c.req.header("content-type") ?? "";
  if (!contentType.includes("multipart/form-data")) {
    return c.json(
      { error: "Send multipart/form-data with a `file` field" },
      400,
    );
  }

  let form: FormData;
  try {
    form = await c.req.formData();
  } catch {
    return c.json({ error: "Invalid multipart body" }, 400);
  }

  const entry = form.get("file");
  if (!entry || typeof entry === "string") {
    return c.json({ error: "Missing file field" }, 400);
  }

  const blob = entry as Blob & { name?: string };
  const filename = blob.name || "upload";
  const quota = await checkUploadQuota(c.env.CACHE, ownerId, blob.size);
  if (!quota.ok) {
    return c.json({ error: quota.error }, quota.status);
  }

  try {
    const upstream = new FormData();
    upstream.append("file", blob, filename);

    const res = await fetch(
      "https://api.wavespeed.ai/api/v3/media/upload/binary",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${c.env.WAVESPEED_API_KEY}`,
        },
        body: upstream,
      },
    );

    const text = await res.text();
    if (!res.ok) {
      console.error("Media upload failed:", res.status, text.slice(0, 200));
      return c.json(publicErrorPayload(text), res.status === 413 ? 413 : 502);
    }

    const parsed = JSON.parse(text) as {
      data?: {
        download_url?: string;
        url?: string;
        type?: string;
        filename?: string;
        size?: number;
      };
    };
    const url = parsed.data?.download_url ?? parsed.data?.url;
    if (!url) {
      return c.json(
        { error: "Upload failed", message: "No URL returned from media host." },
        502,
      );
    }

    return c.json({
      url,
      type: parsed.data?.type ?? "file",
      filename: parsed.data?.filename ?? filename,
      size: parsed.data?.size ?? blob.size,
    });
  } catch (err) {
    console.error("Media upload error:", err);
    return c.json(publicErrorPayload(err), 502);
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

function publicPriceFields(quote: {
  retailUsd: number;
  compareAtUsd: number | null;
}) {
  const body: { price_usd: number; compare_at_usd?: number } = {
    price_usd: quote.retailUsd,
  };
  if (quote.compareAtUsd != null && quote.compareAtUsd > quote.retailUsd) {
    body.compare_at_usd = quote.compareAtUsd;
  }
  return body;
}

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
    price_usd: creditsToUsd(gen.creditsCost),
    error: gen.error,
    created_at: gen.createdAt,
    updated_at: gen.updatedAt,
  };
}

export { app };
