import { resolveModel } from "@seedance/models";
import { ModelArkClient } from "./modelark";
import { WaveSpeedClient } from "./wavespeed";
import type {
  ImageParams,
  ImageSubmitResult,
  ProviderConfig,
  ProviderName,
  VideoParams,
  VideoSubmitResult,
} from "./types";

export interface FallbackResult<T> {
  result: T;
  provider: ProviderName;
}

export async function submitVideoWithFallback(
  config: ProviderConfig,
  modelId: string,
  params: VideoParams,
): Promise<FallbackResult<VideoSubmitResult>> {
  const model = resolveModel(modelId);
  const modelark = new ModelArkClient(config);
  const wavespeed = new WaveSpeedClient(config);

  if (model.providers.modelark) {
    try {
      const result = await modelark.submitVideo(
        model.providers.modelark,
        params,
      );
      return { result, provider: "modelark" };
    } catch (err) {
      console.error("ModelArk video fallback:", err);
    }
  }

  if (model.providers.wavespeed) {
    const result = await wavespeed.submitVideo(
      model.providers.wavespeed,
      params,
    );
    return { result, provider: "wavespeed" };
  }

  throw new Error(`No provider available for model: ${modelId}`);
}

export async function generateImageWithFallback(
  config: ProviderConfig,
  modelId: string,
  params: ImageParams,
): Promise<FallbackResult<ImageSubmitResult>> {
  const model = resolveModel(modelId);
  const modelark = new ModelArkClient(config);
  const wavespeed = new WaveSpeedClient(config);

  if (model.providers.modelark) {
    try {
      const result = await modelark.generateImage(
        model.providers.modelark,
        params,
      );
      return { result, provider: "modelark" };
    } catch (err) {
      console.error("ModelArk image fallback:", err);
    }
  }

  if (model.providers.wavespeed) {
    const result = await wavespeed.generateImage(
      model.providers.wavespeed,
      params,
    );
    return { result, provider: "wavespeed" };
  }

  throw new Error(`No provider available for model: ${modelId}`);
}

export async function pollProvider(
  config: ProviderConfig,
  provider: ProviderName,
  taskId: string,
) {
  if (provider === "modelark") {
    return new ModelArkClient(config).pollVideo(taskId);
  }
  return new WaveSpeedClient(config).poll(taskId);
}

export { ModelArkClient, WaveSpeedClient };
export * from "./types";
