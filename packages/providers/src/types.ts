export type ProviderName = "modelark" | "wavespeed";

export interface ProviderConfig {
  modelarkApiKey: string;
  wavespeedApiKey: string;
  arkBase: string;
}

export interface VideoSubmitResult {
  provider: ProviderName;
  taskId: string;
}

export interface ImageSubmitResult {
  provider: ProviderName;
  outputUrls: string[];
  taskId?: string;
}

export interface PollResult {
  status: "pending" | "processing" | "completed" | "failed";
  outputUrl?: string;
  error?: string;
}

export interface VideoParams {
  prompt: string;
  aspect_ratio?: string;
  resolution?: string;
  duration?: number;
  image_url?: string;
  video_url?: string;
  reference_images?: string[];
  reference_video_url?: string;
  generate_audio?: boolean;
  camera_fixed?: boolean;
  seed?: number;
}

export interface ImageParams {
  prompt: string;
  size?: string;
  image?: string | string[];
  output_format?: string;
  watermark?: boolean;
  sequential_image_generation?: string;
  max_images?: number;
}
