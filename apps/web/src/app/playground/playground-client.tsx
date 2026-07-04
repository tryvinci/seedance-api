"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  listModels,
  formatPrice,
  chargeUsd,
  formatUsd,
  type ModelDefinition,
} from "@seedance/models";
import { getApiBaseUrl } from "@/lib/api-base";

type Kind = "video" | "image";

type UploadedMedia = {
  url: string;
  filename: string;
  preview?: string;
};

type MediaSlot = {
  accept: string;
  field: "image_url" | "reference_images" | "video_url" | "image";
  label: string;
  hint: string;
  required: boolean;
  max: number;
};

function mediaSlotForModel(model: ModelDefinition | undefined): MediaSlot | null {
  if (!model) return null;
  switch (model.variant) {
    case "image-to-video":
      return {
        accept: "image/*",
        field: "image_url",
        label: "Source image",
        hint: "First-frame image for image-to-video",
        required: true,
        max: 1,
      };
    case "reference-to-video":
      return {
        accept: "image/*",
        field: "reference_images",
        label: "Reference images",
        hint: "Up to 10 reference images",
        required: true,
        max: 10,
      };
    case "video-extend":
    case "video-edit":
      return {
        accept: "video/*",
        field: "video_url",
        label: "Source video",
        hint: "Video to extend or edit",
        required: true,
        max: 1,
      };
    case "image-edit":
      return {
        accept: "image/*",
        field: "image",
        label: "Source image",
        hint: "Image to edit (up to 10 for fusion)",
        required: true,
        max: 10,
      };
    case "sequential":
      return {
        accept: "image/*",
        field: "image",
        label: "Reference images",
        hint: "Optional theme references (up to 10)",
        required: false,
        max: 10,
      };
    default:
      return null;
  }
}

export function PlaygroundClient() {
  const { getToken } = useAuth();
  const models = useMemo(() => listModels(), []);
  const [kind, setKind] = useState<Kind>("video");
  const filtered = models.filter((m) => m.kind === kind);
  const [modelId, setModelId] = useState(
    filtered.find((m) => m.id.includes("2.5"))?.id ?? filtered[0]?.id ?? "",
  );
  const model = models.find((m) => m.id === modelId) ?? filtered[0];
  const mediaSlot = mediaSlotForModel(model);

  const [prompt, setPrompt] = useState(
    "A cinematic drone shot over misty mountains at golden hour",
  );
  const [duration, setDuration] = useState(5);
  const [aspectRatio, setAspectRatio] = useState("16:9");
  const [mediaItems, setMediaItems] = useState<UploadedMedia[]>([]);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState<
    "idle" | "running" | "completed" | "failed"
  >("idle");
  const [error, setError] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [generationId, setGenerationId] = useState<string | null>(null);
  const [charged, setCharged] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMediaItems((prev) => {
      for (const item of prev) {
        if (item.preview) URL.revokeObjectURL(item.preview);
      }
      return [];
    });
  }, [modelId]);

  const estimate = model
    ? kind === "video"
      ? chargeUsd(model, { duration })
      : model.priceUsd
    : 0;

  const mediaReady =
    !mediaSlot?.required || mediaItems.length > 0;
  const canGenerate =
    Boolean(prompt.trim()) && mediaReady && status !== "running" && !uploading;

  async function authHeaders(): Promise<HeadersInit> {
    const token = await getToken();
    if (!token) throw new Error("Not signed in");
    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
  }

  async function uploadFiles(files: FileList | File[]) {
    if (!mediaSlot) return;
    const list = Array.from(files);
    if (list.length === 0) return;

    const remaining = mediaSlot.max - mediaItems.length;
    if (remaining <= 0) {
      setError(`You can upload at most ${mediaSlot.max} file(s) for this model.`);
      return;
    }

    setUploading(true);
    setError(null);
    try {
      const token = await getToken();
      if (!token) throw new Error("Not signed in");
      const apiBase = getApiBaseUrl();
      const next: UploadedMedia[] = [];

      for (const file of list.slice(0, remaining)) {
        const form = new FormData();
        form.append("file", file);
        const res = await fetch(`${apiBase}/v1/media/upload`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: form,
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.message ?? data.error ?? "Upload failed");
        }
        next.push({
          url: data.url as string,
          filename: (data.filename as string) ?? file.name,
          preview: file.type.startsWith("image/")
            ? URL.createObjectURL(file)
            : undefined,
        });
      }

      setMediaItems((prev) => [...prev, ...next]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function removeMedia(index: number) {
    setMediaItems((prev) => {
      const item = prev[index];
      if (item?.preview) URL.revokeObjectURL(item.preview);
      return prev.filter((_, i) => i !== index);
    });
  }

  function mediaPayload(): Record<string, unknown> {
    if (!mediaSlot || mediaItems.length === 0) return {};
    const urls = mediaItems.map((m) => m.url);
    if (mediaSlot.field === "image_url" || mediaSlot.field === "video_url") {
      return { [mediaSlot.field]: urls[0] };
    }
    if (mediaSlot.field === "reference_images") {
      return { reference_images: urls };
    }
    return { image: urls.length === 1 ? urls[0] : urls };
  }

  async function pollGeneration(id: string, headers: HeadersInit) {
    const apiBase = getApiBaseUrl();
    for (let i = 0; i < 120; i++) {
      await new Promise((r) => setTimeout(r, 2500));
      const res = await fetch(`${apiBase}/v1/generations/${id}`, { headers });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message ?? data.error ?? "Poll failed");
      }
      if (data.status === "completed" && data.output_url) {
        setResultUrl(data.output_url);
        setCharged(data.price_usd ?? estimate);
        setStatus("completed");
        return;
      }
      if (data.status === "failed") {
        throw new Error(data.error ?? data.message ?? "Generation failed");
      }
    }
    throw new Error("Generation timed out. Please try again.");
  }

  async function generate() {
    if (!model || !prompt.trim() || !mediaReady) return;
    setStatus("running");
    setError(null);
    setResultUrl(null);
    setGenerationId(null);
    setCharged(null);

    try {
      const headers = await authHeaders();
      const apiBase = getApiBaseUrl();
      const media = mediaPayload();

      if (kind === "video") {
        const res = await fetch(`${apiBase}/v1/videos`, {
          method: "POST",
          headers,
          body: JSON.stringify({
            model: model.id,
            prompt: prompt.trim(),
            duration,
            aspect_ratio: aspectRatio,
            ...media,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.message ?? data.error ?? "Request failed");
        }
        setGenerationId(data.id);
        setCharged(data.price_usd ?? estimate);
        await pollGeneration(data.id, headers);
      } else {
        const res = await fetch(`${apiBase}/v1/images`, {
          method: "POST",
          headers,
          body: JSON.stringify({
            model: model.id,
            prompt: prompt.trim(),
            ...media,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.message ?? data.error ?? "Request failed");
        }
        setGenerationId(data.id);
        setResultUrl(data.output_urls?.[0] ?? null);
        setCharged(data.price_usd ?? estimate);
        setStatus("completed");
      }
    } catch (err) {
      setStatus("failed");
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  return (
    <div className="min-h-[80vh] bg-hero text-paper">
      <div className="mx-auto grid max-w-6xl gap-8 px-6 py-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-paper/40">
            Playground
          </p>
          <h1 className="mt-2 font-display text-4xl tracking-tight text-paper">
            Try the models
          </h1>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-paper/60">
            Generate video or images with your account balance. Same API your
            apps will call.
          </p>

          <div className="mt-8 space-y-5">
            <div className="inline-flex rounded-full bg-white/10 p-1">
              {(
                [
                  ["video", "Video"],
                  ["image", "Image"],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    setKind(id);
                    const first =
                      models.find(
                        (m) =>
                          m.kind === id &&
                          (id === "video"
                            ? m.id.includes("2.5")
                            : m.id.includes("5.0")),
                      ) ?? models.find((m) => m.kind === id);
                    if (first) setModelId(first.id);
                    setStatus("idle");
                    setError(null);
                    setResultUrl(null);
                  }}
                  className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                    kind === id
                      ? "bg-white text-hero"
                      : "text-paper/60 hover:text-paper"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <label className="block text-sm">
              <span className="text-paper/50">Model</span>
              <select
                value={model?.id ?? ""}
                onChange={(e) => setModelId(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 font-mono text-sm text-paper outline-none focus:border-accent"
              >
                {filtered.map((m) => (
                  <option key={m.id} value={m.id} className="bg-hero text-paper">
                    {m.id} — {formatPrice(m.priceUsd, m.priceUnit)}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm">
              <span className="text-paper/50">Prompt</span>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={4}
                className="mt-1.5 w-full resize-y rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-paper outline-none placeholder:text-paper/30 focus:border-accent"
                placeholder="Describe what you want to generate…"
              />
            </label>

            {mediaSlot && (
              <div className="block text-sm">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-paper/50">
                    {mediaSlot.label}
                    {mediaSlot.required ? (
                      <span className="text-paper/30"> (required)</span>
                    ) : null}
                  </span>
                  <span className="text-xs text-paper/30">{mediaSlot.hint}</span>
                </div>

                {mediaItems.length > 0 && (
                  <ul className="mt-2 flex flex-wrap gap-2">
                    {mediaItems.map((item, index) => (
                      <li
                        key={`${item.url}-${index}`}
                        className="group relative overflow-hidden rounded-xl border border-white/10 bg-white/5"
                      >
                        {item.preview ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={item.preview}
                            alt={item.filename}
                            className="h-20 w-20 object-cover"
                          />
                        ) : (
                          <div className="flex h-20 w-28 items-center justify-center px-2 text-center text-[11px] text-paper/50">
                            {item.filename}
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => removeMedia(index)}
                          className="absolute right-1 top-1 rounded-full bg-black/70 px-1.5 py-0.5 text-[10px] text-paper/80 opacity-0 transition group-hover:opacity-100"
                          aria-label={`Remove ${item.filename}`}
                        >
                          ✕
                        </button>
                      </li>
                    ))}
                  </ul>
                )}

                {mediaItems.length < mediaSlot.max && (
                  <label
                    className={`mt-2 flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-white/15 bg-white/[0.03] px-4 py-6 text-center transition hover:border-accent/50 hover:bg-white/[0.05] ${
                      uploading ? "pointer-events-none opacity-60" : ""
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept={mediaSlot.accept}
                      multiple={mediaSlot.max > 1}
                      className="sr-only"
                      disabled={uploading}
                      onChange={(e) => {
                        if (e.target.files) void uploadFiles(e.target.files);
                      }}
                    />
                    <span className="text-sm text-paper/70">
                      {uploading
                        ? "Uploading…"
                        : mediaSlot.max > 1
                          ? "Click to upload images"
                          : mediaSlot.accept.startsWith("video")
                            ? "Click to upload a video"
                            : "Click to upload an image"}
                    </span>
                    <span className="mt-1 text-xs text-paper/35">
                      JPG, PNG, WebP
                      {mediaSlot.accept.startsWith("video")
                        ? ", MP4, MOV, WebM"
                        : ""}{" "}
                      · max 25 MB
                    </span>
                  </label>
                )}
              </div>
            )}

            {kind === "video" && (
              <div className="grid grid-cols-2 gap-3">
                <label className="block text-sm">
                  <span className="text-paper/50">Duration (sec)</span>
                  <input
                    type="number"
                    min={3}
                    max={15}
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value) || 5)}
                    className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-paper outline-none focus:border-accent"
                  />
                </label>
                <label className="block text-sm">
                  <span className="text-paper/50">Aspect ratio</span>
                  <select
                    value={aspectRatio}
                    onChange={(e) => setAspectRatio(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-paper outline-none focus:border-accent"
                  >
                    {["16:9", "9:16", "1:1", "4:3", "3:4", "21:9"].map((r) => (
                      <option key={r} value={r} className="bg-hero">
                        {r}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <p className="text-sm text-paper/50">
                Est.{" "}
                <span className="font-medium text-paper">
                  {formatUsd(estimate)}
                </span>
                {kind === "video" && model && (
                  <span className="text-paper/40">
                    {" "}
                    ({duration}s × {formatPrice(model.priceUsd, "second")})
                  </span>
                )}
              </p>
              <button
                type="button"
                onClick={generate}
                disabled={!canGenerate}
                className="inline-flex items-center justify-center rounded-full bg-accent px-6 py-2.5 text-sm font-medium text-white transition hover:bg-accent-deep disabled:opacity-50"
              >
                {status === "running" ? "Generating…" : "Generate"}
              </button>
            </div>

            {error && (
              <div className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                {error}
              </div>
            )}
          </div>
        </div>

        <div className="flex min-h-[420px] flex-col rounded-3xl border border-white/10 bg-black/40 p-4 backdrop-blur-sm">
          <div className="flex items-center justify-between px-2 pb-3">
            <p className="font-mono text-[11px] uppercase tracking-wider text-paper/40">
              Output
            </p>
            {generationId && (
              <p className="font-mono text-[10px] text-paper/30">
                {generationId.slice(0, 8)}…
              </p>
            )}
          </div>

          <div className="relative flex flex-1 items-center justify-center overflow-hidden rounded-2xl bg-black/50">
            {status === "idle" && (
              <p className="max-w-xs px-6 text-center text-sm text-paper/40">
                Your generation will appear here.
              </p>
            )}
            {status === "running" && (
              <div className="flex flex-col items-center gap-3">
                <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-accent" />
                <p className="text-sm text-paper/50">Generating…</p>
              </div>
            )}
            {status === "completed" && resultUrl && kind === "video" && (
              <video
                src={resultUrl}
                controls
                autoPlay
                className="max-h-[520px] w-full object-contain"
              />
            )}
            {status === "completed" && resultUrl && kind === "image" && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={resultUrl}
                alt="Generated"
                className="max-h-[520px] w-full object-contain"
              />
            )}
            {status === "failed" && (
              <p className="max-w-xs px-6 text-center text-sm text-paper/50">
                Generation failed. Adjust your prompt or try another model.
              </p>
            )}
          </div>

          {status === "completed" && (
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 px-1 text-sm text-paper/50">
              <span>
                Charged{" "}
                <span className="text-paper">
                  {formatUsd(charged ?? estimate)}
                </span>
              </span>
              {resultUrl && (
                <a
                  href={resultUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-accent hover:underline"
                >
                  Open full size
                </a>
              )}
            </div>
          )}

          <p className="mt-4 px-1 text-xs text-paper/30">
            Need more balance?{" "}
            <Link href="/dashboard" className="text-paper/50 hover:text-paper">
              Open dashboard
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
