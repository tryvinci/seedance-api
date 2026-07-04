import {
  imageParamsSchema,
  videoParamsSchema,
  type ModelDefinition,
} from "./types";

function video(
  id: string,
  displayName: string,
  family: string,
  variant: ModelDefinition["variant"],
  credits: number,
  providers: ModelDefinition["providers"],
  description: string,
  opts?: Partial<Pick<ModelDefinition, "aliasOf" | "available">>,
): ModelDefinition {
  return {
    id,
    displayName,
    family,
    kind: "video",
    variant,
    description,
    credits,
    providers,
    paramsSchema: videoParamsSchema,
    available: opts?.available ?? true,
    aliasOf: opts?.aliasOf,
  };
}

function image(
  id: string,
  displayName: string,
  family: string,
  variant: ModelDefinition["variant"],
  credits: number,
  providers: ModelDefinition["providers"],
  description: string,
): ModelDefinition {
  return {
    id,
    displayName,
    family,
    kind: "image",
    variant,
    description,
    credits,
    providers,
    paramsSchema: imageParamsSchema,
    available: true,
  };
}

export const MODEL_CATALOG: ModelDefinition[] = [
  // Seedance 2.5
  video(
    "seedance-2.5/text-to-video",
    "Seedance 2.5 Text-to-Video",
    "seedance-2.5",
    "text-to-video",
    120,
    {
      modelark: "dreamina-seedance-2-0-260128",
      wavespeed: "bytedance/seedance-2.0/text-to-video",
    },
    "Next-gen cinematic text-to-video.",
  ),
  video(
    "seedance-2.5/image-to-video",
    "Seedance 2.5 Image-to-Video",
    "seedance-2.5",
    "image-to-video",
    120,
    {
      modelark: "dreamina-seedance-2-0-260128",
      wavespeed: "bytedance/seedance-2.0/image-to-video",
    },
    "Next-gen image-to-video.",
  ),
  video(
    "seedance-2.5/reference-to-video",
    "Seedance 2.5 Reference-to-Video",
    "seedance-2.5",
    "reference-to-video",
    140,
    {
      wavespeed: "bytedance/seedance-2.0/text-to-video",
    },
    "Multimodal reference-to-video.",
  ),

  // Seedance 2.0 Standard
  video(
    "seedance-2.0/text-to-video",
    "Seedance 2.0 Text-to-Video",
    "seedance-2.0",
    "text-to-video",
    120,
    {
      modelark: "dreamina-seedance-2-0-260128",
      wavespeed: "bytedance/seedance-2.0/text-to-video",
    },
    "Hollywood-grade cinematic text-to-video with native audio sync.",
  ),
  video(
    "seedance-2.0/image-to-video",
    "Seedance 2.0 Image-to-Video",
    "seedance-2.0",
    "image-to-video",
    120,
    {
      modelark: "dreamina-seedance-2-0-260128",
      wavespeed: "bytedance/seedance-2.0/image-to-video",
    },
    "Animate reference images with cinematic motion and audio.",
  ),
  video(
    "seedance-2.0/reference-to-video",
    "Seedance 2.0 Reference-to-Video",
    "seedance-2.0",
    "reference-to-video",
    140,
    {
      wavespeed: "bytedance/seedance-2.0/text-to-video",
    },
    "Multimodal reference-guided video generation.",
  ),
  video(
    "seedance-2.0/video-extend",
    "Seedance 2.0 Video Extend",
    "seedance-2.0",
    "video-extend",
    100,
    {
      wavespeed: "bytedance/seedance-2.0/video-extend",
    },
    "Extend an existing video from its last frame.",
  ),
  video(
    "seedance-2.0/video-edit",
    "Seedance 2.0 Video Edit",
    "seedance-2.0",
    "video-edit",
    110,
    {
      wavespeed: "bytedance/seedance-2.0/video-edit",
    },
    "Edit lighting, style, and atmosphere of existing video.",
  ),
  video(
    "seedance-2.0/text-to-video-turbo",
    "Seedance 2.0 Text-to-Video Turbo",
    "seedance-2.0",
    "text-to-video",
    90,
    {
      wavespeed: "bytedance/seedance-2.0/text-to-video-turbo",
    },
    "High-resolution turbo text-to-video at near-480p speed.",
  ),
  video(
    "seedance-2.0/image-to-video-turbo",
    "Seedance 2.0 Image-to-Video Turbo",
    "seedance-2.0",
    "image-to-video",
    90,
    {
      wavespeed: "bytedance/seedance-2.0/image-to-video-turbo",
    },
    "High-resolution turbo image-to-video.",
  ),

  // Seedance 2.0 Fast
  video(
    "seedance-2.0-fast/text-to-video",
    "Seedance 2.0 Fast Text-to-Video",
    "seedance-2.0-fast",
    "text-to-video",
    80,
    {
      modelark: "dreamina-seedance-2-0-fast-260128",
      wavespeed: "bytedance/seedance-2.0-fast/text-to-video",
    },
    "Speed-optimized cinematic text-to-video.",
  ),
  video(
    "seedance-2.0-fast/image-to-video",
    "Seedance 2.0 Fast Image-to-Video",
    "seedance-2.0-fast",
    "image-to-video",
    80,
    {
      modelark: "dreamina-seedance-2-0-fast-260128",
      wavespeed: "bytedance/seedance-2.0-fast/image-to-video",
    },
    "Speed-optimized image-to-video.",
  ),
  video(
    "seedance-2.0-fast/text-to-video-turbo",
    "Seedance 2.0 Fast Text-to-Video Turbo",
    "seedance-2.0-fast",
    "text-to-video",
    70,
    {
      wavespeed: "bytedance/seedance-2.0-fast/text-to-video-turbo",
    },
    "Fastest, most affordable turbo text-to-video.",
  ),
  video(
    "seedance-2.0-fast/image-to-video-turbo",
    "Seedance 2.0 Fast Image-to-Video Turbo",
    "seedance-2.0-fast",
    "image-to-video",
    70,
    {
      wavespeed: "bytedance/seedance-2.0-fast/image-to-video-turbo",
    },
    "Fastest turbo image-to-video.",
  ),
  video(
    "seedance-2.0-fast/video-extend",
    "Seedance 2.0 Fast Video Extend",
    "seedance-2.0-fast",
    "video-extend",
    70,
    {
      wavespeed: "bytedance/seedance-2.0-fast/video-extend",
    },
    "Fast video extension from last frame.",
  ),
  video(
    "seedance-2.0-fast/video-edit",
    "Seedance 2.0 Fast Video Edit",
    "seedance-2.0-fast",
    "video-edit",
    75,
    {
      wavespeed: "bytedance/seedance-2.0-fast/video-edit",
    },
    "Fast prompt-guided video editing.",
  ),

  // Seedance 2.0 Mini
  video(
    "seedance-2.0-mini/text-to-video",
    "Seedance 2.0 Mini Text-to-Video",
    "seedance-2.0-mini",
    "text-to-video",
    85,
    {
      wavespeed: "bytedance/seedance-2.0-mini/text-to-video",
    },
    "Lower-cost multi-shot text-to-video.",
  ),
  video(
    "seedance-2.0-mini/image-to-video",
    "Seedance 2.0 Mini Image-to-Video",
    "seedance-2.0-mini",
    "image-to-video",
    85,
    {
      wavespeed: "bytedance/seedance-2.0-mini/image-to-video",
    },
    "Lower-cost multi-shot image-to-video.",
  ),
  video(
    "seedance-2.0-mini/video-extend",
    "Seedance 2.0 Mini Video Extend",
    "seedance-2.0-mini",
    "video-extend",
    75,
    {
      wavespeed: "bytedance/seedance-2.0-mini/video-extend",
    },
    "Lower-cost video extension.",
  ),
  video(
    "seedance-2.0-mini/video-edit",
    "Seedance 2.0 Mini Video Edit",
    "seedance-2.0-mini",
    "video-edit",
    80,
    {
      wavespeed: "bytedance/seedance-2.0-mini/video-edit",
    },
    "Lower-cost video editing.",
  ),

  // Seedance 1.x
  video(
    "seedance-1.5-pro/text-to-video",
    "Seedance 1.5 Pro Text-to-Video",
    "seedance-1.5-pro",
    "text-to-video",
    60,
    {
      modelark: "seedance-1-5-pro-251215",
      wavespeed: "bytedance/seedance-v1.5-pro/text-to-video",
    },
    "Seedance 1.5 Pro text-to-video with audio support.",
  ),
  video(
    "seedance-1.5-pro/image-to-video",
    "Seedance 1.5 Pro Image-to-Video",
    "seedance-1.5-pro",
    "image-to-video",
    60,
    {
      modelark: "seedance-1-5-pro-251215",
      wavespeed: "bytedance/seedance-v1.5-pro/image-to-video",
    },
    "Seedance 1.5 Pro image-to-video with audio support.",
  ),
  video(
    "seedance-1.0-pro/text-to-video",
    "Seedance 1.0 Pro Text-to-Video",
    "seedance-1.0-pro",
    "text-to-video",
    50,
    {
      modelark: "seedance-1-0-pro-250528",
      wavespeed: "bytedance/seedance-v1-pro/text-to-video",
    },
    "Seedance 1.0 Pro text-to-video.",
  ),
  video(
    "seedance-1.0-pro/image-to-video",
    "Seedance 1.0 Pro Image-to-Video",
    "seedance-1.0-pro",
    "image-to-video",
    50,
    {
      modelark: "seedance-1-0-pro-250528",
      wavespeed: "bytedance/seedance-v1-pro/image-to-video",
    },
    "Seedance 1.0 Pro image-to-video.",
  ),
  video(
    "seedance-1.0-pro-fast/text-to-video",
    "Seedance 1.0 Pro Fast Text-to-Video",
    "seedance-1.0-pro",
    "text-to-video",
    40,
    {
      modelark: "seedance-1-0-pro-fast-251015",
      wavespeed: "bytedance/seedance-v1-pro-fast/text-to-video",
    },
    "Fast Seedance 1.0 Pro text-to-video.",
  ),

  // Seedream 5.0
  image(
    "seedream-5.0/text-to-image",
    "Seedream 5.0 Text-to-Image",
    "seedream-5.0",
    "text-to-image",
    15,
    {
      modelark: "seedream-5-0-260128",
      wavespeed: "bytedance/seedream-v5.0",
    },
    "Latest Seedream text-to-image with 2K/3K output.",
  ),
  image(
    "seedream-5.0-lite/text-to-image",
    "Seedream 5.0 Lite Text-to-Image",
    "seedream-5.0-lite",
    "text-to-image",
    10,
    {
      modelark: "seedream-5-0-lite-260128",
      wavespeed: "bytedance/seedream-v5.0-lite",
    },
    "Lightweight Seedream 5.0 for fast generation.",
  ),
  image(
    "seedream-5.0-lite/image-edit",
    "Seedream 5.0 Lite Image Edit",
    "seedream-5.0-lite",
    "image-edit",
    12,
    {
      modelark: "seedream-5-0-lite-260128",
      wavespeed: "bytedance/seedream-v5.0-lite/edit",
    },
    "Image editing with Seedream 5.0 Lite.",
  ),

  // Seedream 4.5
  image(
    "seedream-4.5/text-to-image",
    "Seedream 4.5 Text-to-Image",
    "seedream-4.5",
    "text-to-image",
    12,
    {
      modelark: "seedream-4-5-251128",
      wavespeed: "bytedance/seedream-v4.5",
    },
    "Seedream 4.5 text-to-image with typography and 4K support.",
  ),
  image(
    "seedream-4.5/image-edit",
    "Seedream 4.5 Image Edit",
    "seedream-4.5",
    "image-edit",
    14,
    {
      modelark: "seedream-4-5-251128",
      wavespeed: "bytedance/seedream-v4.5/edit",
    },
    "Portrait editing and style transfer with Seedream 4.5.",
  ),
  image(
    "seedream-4.5/sequential",
    "Seedream 4.5 Sequential",
    "seedream-4.5",
    "sequential",
    14,
    {
      modelark: "seedream-4-5-251128",
      wavespeed: "bytedance/seedream-v4.5/sequential",
    },
    "Batch sequential image generation with theme consistency.",
  ),

  // Seedream 4.0
  image(
    "seedream-4.0/text-to-image",
    "Seedream 4.0 Text-to-Image",
    "seedream-4.0",
    "text-to-image",
    8,
    {
      modelark: "seedream-4-0-250828",
      wavespeed: "bytedance/seedream-v4",
    },
    "Seedream 4.0 text-to-image with multi-image fusion.",
  ),
  image(
    "seedream-4.0/image-edit",
    "Seedream 4.0 Image Edit",
    "seedream-4.0",
    "image-edit",
    10,
    {
      modelark: "seedream-4-0-250828",
      wavespeed: "bytedance/seedream-v4/edit",
    },
    "Image editing and multi-image fusion with Seedream 4.0.",
  ),
  image(
    "seedream-4.0/sequential",
    "Seedream 4.0 Sequential",
    "seedream-4.0",
    "sequential",
    10,
    {
      modelark: "seedream-4-0-250828",
      wavespeed: "bytedance/seedream-v4/sequential",
    },
    "Batch sequential generation with Seedream 4.0.",
  ),
];

export function getModel(id: string): ModelDefinition | undefined {
  return MODEL_CATALOG.find((m) => m.id === id);
}

export function resolveModel(id: string): ModelDefinition {
  const model = getModel(id);
  if (!model) throw new Error(`Unknown model: ${id}`);
  if (model.aliasOf) {
    const resolved = getModel(model.aliasOf);
    if (!resolved) throw new Error(`Alias target not found: ${model.aliasOf}`);
    return { ...model, providers: { ...resolved.providers, ...model.providers } };
  }
  return model;
}

export function listModels(filters?: {
  kind?: "video" | "image";
  family?: string;
}): ModelDefinition[] {
  return MODEL_CATALOG.filter((m) => {
    if (filters?.kind && m.kind !== filters.kind) return false;
    if (filters?.family && m.family !== filters.family) return false;
    return true;
  });
}

export function listFamilies(): string[] {
  return [...new Set(MODEL_CATALOG.map((m) => m.family))];
}
