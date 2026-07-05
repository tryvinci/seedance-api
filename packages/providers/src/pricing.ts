import {
  chargeCredits,
  chargeUsd,
  getWavespeedPaths,
  resolveModel,
  retailCreditsFromCosts,
  usdToCredits,
  type ModelDefinition,
} from "@seedance/models";
import { WaveSpeedClient } from "./wavespeed";
import type {
  ImageParams,
  ProviderConfig,
  ProviderName,
  VideoParams,
} from "./types";

export interface GenerationQuote {
  retailCredits: number;
  retailUsd: number;
  catalogUsd: number;
  providerCostUsd: number | null;
  providerCostCredits: number | null;
  marginUsd: number | null;
  markup: number | null;
  provider: ProviderName | null;
  providerModelPath: string | null;
}

function wavespeedVideoInputs(params: VideoParams): Record<string, unknown> {
  const inputs: Record<string, unknown> = {
    prompt: params.prompt,
    aspect_ratio: params.aspect_ratio ?? "16:9",
    resolution: params.resolution ?? "720p",
    duration: params.duration ?? 5,
    generate_audio: params.generate_audio ?? false,
  };
  if (params.image_url) inputs.image = params.image_url;
  if (params.video_url) inputs.video = params.video_url;
  if (params.reference_images?.length) {
    inputs.reference_images = params.reference_images;
  }
  if (params.reference_video_url) {
    inputs.reference_video = params.reference_video_url;
  }
  if (params.seed !== undefined) inputs.seed = params.seed;
  return inputs;
}

function wavespeedImageInputs(params: ImageParams): Record<string, unknown> {
  const inputs: Record<string, unknown> = {
    prompt: params.prompt,
    size: wavespeedImageSize(params.size),
    output_format: params.output_format ?? "jpeg",
  };
  if (params.image) {
    inputs.images = Array.isArray(params.image) ? params.image : [params.image];
  }
  if (params.max_images != null) inputs.max_images = params.max_images;
  return inputs;
}

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

async function quoteWaveSpeed(
  client: WaveSpeedClient,
  model: ModelDefinition,
  params: VideoParams | ImageParams,
): Promise<{ costUsd: number; modelPath: string }> {
  const paths = getWavespeedPaths(model);
  if (paths.length === 0) {
    throw new Error("No WaveSpeed path configured");
  }

  const inputs =
    model.kind === "video"
      ? wavespeedVideoInputs(params as VideoParams)
      : wavespeedImageInputs(params as ImageParams);

  let lastError: Error | undefined;
  for (const modelPath of paths) {
    try {
      const costUsd = await client.quotePricing(modelPath, inputs);
      return { costUsd, modelPath };
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      console.warn(`WaveSpeed pricing miss (${modelPath}):`, lastError.message);
    }
  }

  throw lastError ?? new Error("WaveSpeed pricing unavailable");
}

export async function quoteGeneration(
  config: ProviderConfig,
  modelId: string,
  params: VideoParams | ImageParams,
  keys: { modelark: boolean; wavespeed: boolean },
): Promise<GenerationQuote> {
  const model = resolveModel(modelId);
  const catalogCredits = chargeCredits(
    model,
    model.kind === "video"
      ? { duration: (params as VideoParams).duration }
      : undefined,
  );
  const catalogUsd = chargeUsd(
    model,
    model.kind === "video"
      ? { duration: (params as VideoParams).duration }
      : undefined,
  );

  const wsPaths = getWavespeedPaths(model);
  if (wsPaths.length > 0 && keys.wavespeed && config.wavespeedApiKey?.trim()) {
    try {
      const client = new WaveSpeedClient(config);
      const { costUsd, modelPath } = await quoteWaveSpeed(client, model, params);
      const providerCostCredits = usdToCredits(costUsd);
      const retail = retailCreditsFromCosts(model, catalogCredits, costUsd);
      return {
        retailCredits: retail.retailCredits,
        retailUsd: retail.retailUsd,
        catalogUsd,
        providerCostUsd: costUsd,
        providerCostCredits,
        marginUsd: retail.marginUsd,
        markup: retail.markup,
        provider: "wavespeed",
        providerModelPath: modelPath,
      };
    } catch (err) {
      console.error("WaveSpeed quote failed, using catalog fallback:", err);
    }
  }

  if (model.providers.modelark && keys.modelark && config.modelarkApiKey?.trim()) {
    return {
      retailCredits: catalogCredits,
      retailUsd: catalogUsd,
      catalogUsd,
      providerCostUsd: null,
      providerCostCredits: null,
      marginUsd: null,
      markup: null,
      provider: "modelark",
      providerModelPath: model.providers.modelark,
    };
  }

  throw new Error(`No provider available to quote model: ${modelId}`);
}

export { wavespeedImageSize };
