import type {
  ImageParams,
  ImageSubmitResult,
  PollResult,
  ProviderConfig,
  VideoParams,
  VideoSubmitResult,
} from "./types";

const WAVESPEED_BASE = "https://api.wavespeed.ai/api/v3";

/** Account volume discount on upstream list price (passed through to retail). */
const WAVESPEED_ACCOUNT_DISCOUNT = 0.15;

export class WaveSpeedClient {
  constructor(private config: ProviderConfig) {}

  private headers() {
    return {
      Authorization: `Bearer ${this.config.wavespeedApiKey}`,
      "Content-Type": "application/json",
    };
  }

  async submitVideo(
    modelPaths: string | string[],
    params: VideoParams,
  ): Promise<VideoSubmitResult> {
    const body: Record<string, unknown> = {
      prompt: params.prompt,
      aspect_ratio: params.aspect_ratio ?? "16:9",
      resolution: params.resolution ?? "720p",
      duration: params.duration ?? 5,
      generate_audio: params.generate_audio ?? false,
    };
    if (params.image_url) body.image = params.image_url;
    if (params.video_url) body.video = params.video_url;
    if (params.reference_images) body.reference_images = params.reference_images;
    if (params.reference_video_url) {
      body.reference_video = params.reference_video_url;
    }
    if (params.seed !== undefined) body.seed = params.seed;

    return this.postWithPathFallback(modelPaths, body, (data) => {
      const inner = (data.data ?? data) as { id?: string };
      const taskId = inner.id ?? (data.id as string | undefined);
      if (!taskId) throw new Error("WaveSpeed: no task id returned");
      return { provider: "wavespeed" as const, taskId };
    });
  }

  /** Quote upstream list + net USD for one inference. */
  async quotePricing(
    modelId: string,
    inputs: Record<string, unknown>,
  ): Promise<{ listCostUsd: number; costUsd: number }> {
    const res = await fetch(`${WAVESPEED_BASE}/model/pricing`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({ model_id: modelId, inputs }),
    });

    const text = await res.text();
    if (!res.ok) {
      throw new Error(`WaveSpeed pricing failed: ${res.status} ${text}`);
    }

    let data: {
      code?: number;
      message?: string;
      data?: { unit_price?: number; origin_price?: number };
    };
    try {
      data = JSON.parse(text) as typeof data;
    } catch {
      throw new Error(`WaveSpeed pricing invalid JSON: ${text.slice(0, 200)}`);
    }

    if (typeof data.code === "number" && data.code !== 200) {
      throw new Error(
        `WaveSpeed pricing failed: ${data.code} ${data.message ?? text}`,
      );
    }

    const unitPrice = data.data?.unit_price;
    if (typeof unitPrice !== "number" || unitPrice <= 0) {
      throw new Error("WaveSpeed pricing: missing unit_price");
    }

    const originPrice = data.data?.origin_price;
    const listCostUsd =
      typeof originPrice === "number" && originPrice > 0
        ? originPrice
        : unitPrice;
    const costUsd =
      typeof originPrice === "number" &&
      originPrice > unitPrice &&
      unitPrice > 0
        ? unitPrice
        : Math.round(listCostUsd * (1 - WAVESPEED_ACCOUNT_DISCOUNT) * 100) /
          100;

    return { listCostUsd, costUsd };
  }

  /** Fetch actual billed amount for a completed prediction. */
  async getBillingForPrediction(predictionUuid: string): Promise<number | null> {
    const res = await fetch(`${WAVESPEED_BASE}/billings/search`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({
        billing_type: "deduct",
        prediction_uuids: [predictionUuid],
        page: 1,
        page_size: 1,
      }),
    });

    if (!res.ok) {
      console.warn("WaveSpeed billing lookup failed:", res.status);
      return null;
    }

    const data = (await res.json()) as {
      data?: {
        items?: Array<{ price?: number }>;
      };
    };
    const price = data.data?.items?.[0]?.price;
    return typeof price === "number" && price > 0 ? price : null;
  }

  async poll(taskId: string): Promise<PollResult> {
    // WaveSpeed result endpoint is /predictions/{id}/result (not /predictions/{id}).
    const res = await fetch(
      `${WAVESPEED_BASE}/predictions/${taskId}/result`,
      { headers: this.headers() },
    );

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`WaveSpeed poll failed: ${res.status} ${text}`);
    }

    const data = (await res.json()) as {
      data?: {
        status?: string;
        outputs?: string[];
        error?: string;
      };
      status?: string;
      outputs?: string[];
      error?: string;
    };

    const inner = data.data ?? data;
    const status = mapWaveSpeedStatus(inner.status ?? "pending");
    const outputUrl = inner.outputs?.[0];
    return { status, outputUrl, error: inner.error };
  }

  async generateImage(
    modelPaths: string | string[],
    params: ImageParams,
  ): Promise<ImageSubmitResult> {
    // WaveSpeed Seedream expects "2048*2048", not ModelArk-style "2K".
    const body: Record<string, unknown> = {
      prompt: params.prompt,
      size: wavespeedImageSize(params.size),
      output_format: params.output_format ?? "jpeg",
      enable_sync_mode: false,
    };
    if (params.image) {
      body.images = Array.isArray(params.image) ? params.image : [params.image];
    }
    if (params.max_images != null) {
      body.max_images = params.max_images;
    }

    return this.postWithPathFallback(modelPaths, body, async (data) => {
      const inner = (data.data ?? data) as {
        id?: string;
        outputs?: string[];
      };
      if (inner.outputs?.length) {
        return { provider: "wavespeed" as const, outputUrls: inner.outputs };
      }

      const taskId = inner.id ?? (data.id as string | undefined);
      if (taskId) {
        const polled = await this.pollUntilDone(taskId);
        return {
          provider: "wavespeed" as const,
          outputUrls: polled.outputUrl ? [polled.outputUrl] : [],
          taskId,
        };
      }

      throw new Error("WaveSpeed image: no output or task id");
    });
  }

  /**
   * Try primary path then fallbacks when upstream reports model-not-found.
   */
  private async postWithPathFallback<T>(
    modelPaths: string | string[],
    body: Record<string, unknown>,
    parse: (data: Record<string, unknown>) => T | Promise<T>,
  ): Promise<T> {
    const paths = Array.isArray(modelPaths) ? modelPaths : [modelPaths];
    if (paths.length === 0) {
      throw new Error("No WaveSpeed model paths configured");
    }

    let lastError: Error | undefined;
    for (let i = 0; i < paths.length; i++) {
      const modelPath = paths[i];
      const res = await fetch(`${WAVESPEED_BASE}/${modelPath}`, {
        method: "POST",
        headers: this.headers(),
        body: JSON.stringify(body),
      });

      const text = await res.text();
      if (!res.ok) {
        const err = new Error(
          `WaveSpeed request failed: ${res.status} ${text}`,
        );
        lastError = err;
        const morePaths = i < paths.length - 1;
        if (morePaths && isModelNotFoundError(res.status, text)) {
          console.warn(
            `WaveSpeed path missing (${modelPath}), trying fallback…`,
          );
          continue;
        }
        throw err;
      }

      let data: Record<string, unknown>;
      try {
        data = JSON.parse(text) as Record<string, unknown>;
      } catch {
        throw new Error(`WaveSpeed invalid JSON: ${text.slice(0, 200)}`);
      }

      // Some WaveSpeed errors return HTTP 200 with code != 200.
      const code = data.code;
      if (typeof code === "number" && code !== 200) {
        const message = String(data.message ?? text);
        const err = new Error(`WaveSpeed request failed: ${code} ${message}`);
        lastError = err;
        const morePaths = i < paths.length - 1;
        if (morePaths && isModelNotFoundError(code, message)) {
          console.warn(
            `WaveSpeed path missing (${modelPath}), trying fallback…`,
          );
          continue;
        }
        throw err;
      }

      return parse(data);
    }

    throw lastError ?? new Error("WaveSpeed request failed");
  }

  private async pollUntilDone(
    taskId: string,
    maxAttempts = 60,
    intervalMs = 3000,
  ): Promise<PollResult> {
    for (let i = 0; i < maxAttempts; i++) {
      const result = await this.poll(taskId);
      if (result.status === "completed" || result.status === "failed") {
        return result;
      }
      await new Promise((r) => setTimeout(r, intervalMs));
    }
    return { status: "failed", error: "Polling timeout" };
  }
}

function isModelNotFoundError(status: number, body: string): boolean {
  const msg = body.toLowerCase();
  return (
    msg.includes("model not found") ||
    msg.includes("unknown model") ||
    msg.includes("does not exist") ||
    (status === 404 && msg.includes("model"))
  );
}

function mapWaveSpeedStatus(status: string): PollResult["status"] {
  switch (status) {
    case "completed":
    case "succeeded":
      return "completed";
    case "failed":
      return "failed";
    case "processing":
    case "running":
      return "processing";
    default:
      return "pending";
  }
}

/** Map public size presets to WaveSpeed pixel dimensions. */
function wavespeedImageSize(size?: string): string {
  switch (size) {
    case "1K":
      return "1440*1440";
    case "3K":
      return "3072*3072";
    case "4K":
      return "4096*4096";
    case "2K":
    default:
      return "2048*2048";
  }
}
