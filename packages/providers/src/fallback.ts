import { getWavespeedPaths, resolveModel } from "@seedance/models";
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
  const errors: string[] = [];

  if (model.providers.modelark && config.modelarkApiKey?.trim()) {
    try {
      const result = await modelark.submitVideo(
        model.providers.modelark,
        params,
      );
      return { result, provider: "modelark" };
    } catch (err) {
      console.error("ModelArk video fallback:", err);
      errors.push(err instanceof Error ? err.message : String(err));
    }
  }

  const wsPaths = getWavespeedPaths(model);
  if (wsPaths.length > 0 && config.wavespeedApiKey?.trim()) {
    try {
      const result = await wavespeed.submitVideo(wsPaths, params);
      return { result, provider: "wavespeed" };
    } catch (err) {
      console.error("WaveSpeed video failed:", err);
      errors.push(err instanceof Error ? err.message : String(err));
    }
  }

  throw new Error(
    errors[errors.length - 1] ??
      `No provider available for model: ${modelId}`,
  );
}

export async function generateImageWithFallback(
  config: ProviderConfig,
  modelId: string,
  params: ImageParams,
): Promise<FallbackResult<ImageSubmitResult>> {
  const model = resolveModel(modelId);
  const modelark = new ModelArkClient(config);
  const wavespeed = new WaveSpeedClient(config);
  const errors: string[] = [];

  if (model.providers.modelark && config.modelarkApiKey?.trim()) {
    try {
      const result = await modelark.generateImage(
        model.providers.modelark,
        params,
      );
      return { result, provider: "modelark" };
    } catch (err) {
      console.error("ModelArk image fallback:", err);
      errors.push(err instanceof Error ? err.message : String(err));
    }
  }

  const wsPaths = getWavespeedPaths(model);
  if (wsPaths.length > 0 && config.wavespeedApiKey?.trim()) {
    try {
      const result = await wavespeed.generateImage(wsPaths, params);
      return { result, provider: "wavespeed" };
    } catch (err) {
      console.error("WaveSpeed image failed:", err);
      errors.push(err instanceof Error ? err.message : String(err));
    }
  }

  throw new Error(
    errors[errors.length - 1] ??
      `No provider available for model: ${modelId}`,
  );
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
