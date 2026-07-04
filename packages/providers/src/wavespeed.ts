import type {
  ImageParams,
  ImageSubmitResult,
  PollResult,
  ProviderConfig,
  VideoParams,
  VideoSubmitResult,
} from "./types";

const WAVESPEED_BASE = "https://api.wavespeed.ai/api/v3";

export class WaveSpeedClient {
  constructor(private config: ProviderConfig) {}

  private headers() {
    return {
      Authorization: `Bearer ${this.config.wavespeedApiKey}`,
      "Content-Type": "application/json",
    };
  }

  async submitVideo(
    modelPath: string,
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

    const res = await fetch(`${WAVESPEED_BASE}/${modelPath}`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`WaveSpeed video submit failed: ${res.status} ${text}`);
    }

    const data = (await res.json()) as {
      data?: { id?: string };
      id?: string;
    };
    const taskId = data.data?.id ?? data.id;
    if (!taskId) throw new Error("WaveSpeed: no task id returned");
    return { provider: "wavespeed", taskId };
  }

  async poll(taskId: string): Promise<PollResult> {
    const res = await fetch(`${WAVESPEED_BASE}/predictions/${taskId}`, {
      headers: this.headers(),
    });

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
    modelPath: string,
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

    const res = await fetch(`${WAVESPEED_BASE}/${modelPath}`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`WaveSpeed image failed: ${res.status} ${text}`);
    }

    const data = (await res.json()) as {
      data?: { id?: string; outputs?: string[]; status?: string };
      id?: string;
      outputs?: string[];
    };

    const inner = data.data ?? data;
    if (inner.outputs?.length) {
      return { provider: "wavespeed", outputUrls: inner.outputs };
    }

    const taskId = inner.id ?? data.id;
    if (taskId) {
      const polled = await this.pollUntilDone(taskId);
      return {
        provider: "wavespeed",
        outputUrls: polled.outputUrl ? [polled.outputUrl] : [],
        taskId,
      };
    }

    throw new Error("WaveSpeed image: no output or task id");
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
