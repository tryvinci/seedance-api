import type {
  ImageParams,
  ImageSubmitResult,
  PollResult,
  ProviderConfig,
  VideoParams,
  VideoSubmitResult,
} from "./types";

const DEFAULT_ARK_BASE =
  "https://ark.ap-southeast.bytepluses.com";

export class ModelArkClient {
  constructor(private config: ProviderConfig) {}

  private get base() {
    return this.config.arkBase || DEFAULT_ARK_BASE;
  }

  private headers() {
    return {
      Authorization: `Bearer ${this.config.modelarkApiKey}`,
      "Content-Type": "application/json",
    };
  }

  async submitVideo(
    modelId: string,
    params: VideoParams,
  ): Promise<VideoSubmitResult> {
    const content: Array<Record<string, string>> = [
      { type: "text", text: params.prompt },
    ];
    if (params.image_url) {
      content.push({ type: "image_url", image_url: params.image_url });
    }
    if (params.video_url) {
      content.push({ type: "video_url", video_url: params.video_url });
    }

    const body: Record<string, unknown> = {
      model: modelId,
      content,
      ratio: params.aspect_ratio ?? "16:9",
      resolution: params.resolution ?? "720p",
      duration: params.duration ?? 5,
      generate_audio: params.generate_audio ?? false,
    };

    const res = await fetch(
      `${this.base}/api/v3/contents/generations/tasks`,
      {
        method: "POST",
        headers: this.headers(),
        body: JSON.stringify(body),
      },
    );

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`ModelArk video submit failed: ${res.status} ${text}`);
    }

    const data = (await res.json()) as { id: string };
    return { provider: "modelark", taskId: data.id };
  }

  async pollVideo(taskId: string): Promise<PollResult> {
    const res = await fetch(
      `${this.base}/api/v3/contents/generations/tasks/${taskId}`,
      { headers: this.headers() },
    );

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`ModelArk poll failed: ${res.status} ${text}`);
    }

    const data = (await res.json()) as {
      status: string;
      content?: { video_url?: string };
      error?: { message?: string };
    };

    const status = mapModelArkStatus(data.status);
    return {
      status,
      outputUrl: data.content?.video_url,
      error: data.error?.message,
    };
  }

  async generateImage(
    modelId: string,
    params: ImageParams,
  ): Promise<ImageSubmitResult> {
    const body: Record<string, unknown> = {
      model: modelId,
      prompt: params.prompt,
      size: params.size ?? "2K",
      response_format: "url",
      watermark: params.watermark ?? false,
    };
    if (params.image) body.image = params.image;
    if (params.sequential_image_generation) {
      body.sequential_image_generation = params.sequential_image_generation;
    }
    if (params.max_images) {
      body.sequential_image_generation_options = {
        max_images: params.max_images,
      };
    }

    const res = await fetch(`${this.base}/api/v3/images/generations`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`ModelArk image failed: ${res.status} ${text}`);
    }

    const data = (await res.json()) as {
      data?: Array<{ url?: string }>;
    };
    const outputUrls = (data.data ?? [])
      .map((d) => d.url)
      .filter((u): u is string => !!u);

    return { provider: "modelark", outputUrls };
  }
}

function mapModelArkStatus(
  status: string,
): PollResult["status"] {
  switch (status) {
    case "succeeded":
    case "completed":
      return "completed";
    case "failed":
    case "cancelled":
      return "failed";
    case "running":
    case "processing":
      return "processing";
    default:
      return "pending";
  }
}
