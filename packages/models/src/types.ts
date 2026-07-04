import { z } from "zod";

export const aspectRatios = [
  "16:9",
  "9:16",
  "1:1",
  "4:3",
  "3:4",
  "21:9",
] as const;

export const videoResolutions = ["480p", "720p", "1080p", "4k"] as const;
export const imageSizes = ["1K", "2K", "3K", "4K"] as const;

export const videoParamsSchema = z.object({
  prompt: z.string().min(1).max(4000),
  aspect_ratio: z.enum(aspectRatios).default("16:9"),
  resolution: z.enum(videoResolutions).default("720p"),
  duration: z.number().int().min(3).max(15).default(5),
  image_url: z.string().url().optional(),
  video_url: z.string().url().optional(),
  reference_images: z.array(z.string().url()).max(10).optional(),
  reference_video_url: z.string().url().optional(),
  generate_audio: z.boolean().default(false),
  camera_fixed: z.boolean().optional(),
  seed: z.number().int().min(0).optional(),
});

export const imageParamsSchema = z.object({
  prompt: z.string().min(1).max(4000),
  size: z.enum(imageSizes).default("2K"),
  image: z.union([z.string().url(), z.array(z.string().url()).max(10)]).optional(),
  output_format: z.enum(["png", "jpeg"]).default("jpeg"),
  watermark: z.boolean().default(false),
  sequential_image_generation: z.enum(["auto", "disabled"]).default("disabled"),
  max_images: z.number().int().min(1).max(15).optional(),
});

export type VideoParams = z.infer<typeof videoParamsSchema>;
export type ImageParams = z.infer<typeof imageParamsSchema>;

export type ModelKind = "video" | "image";
/** How `priceUsd` is billed and displayed. */
export type PriceUnit = "second" | "generation";
export type VideoVariant =
  | "text-to-video"
  | "image-to-video"
  | "reference-to-video"
  | "video-extend"
  | "video-edit";
export type ImageVariant = "text-to-image" | "image-edit" | "sequential";

export type ModelVariant = VideoVariant | ImageVariant;

export interface ProviderMapping {
  modelark?: string;
  wavespeed?: string;
}

export interface ModelDefinition {
  id: string;
  displayName: string;
  family: string;
  kind: ModelKind;
  variant: ModelVariant;
  description: string;
  /** Unit price in USD (`/sec` for video, `/gen` for image). */
  priceUsd: number;
  priceUnit: PriceUnit;
  /** Internal ledger units for one unit (1s or 1 generation), in cents. */
  credits: number;
  aliasOf?: string;
  available: boolean;
  providers: ProviderMapping;
  paramsSchema: z.ZodTypeAny;
}

export interface CreditPack {
  id: string;
  name: string;
  credits: number;
  priceUsd: number;
}
