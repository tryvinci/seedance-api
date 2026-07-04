import type { Metadata } from "next";
import Link from "next/link";
import { ModelCatalog } from "@/components/model-catalog";
import { getDocsUrl } from "@/lib/docs-url";

export const metadata: Metadata = {
  title: "Models",
  description:
    "Browse SeedDance video and Seedream image models with USD pricing. Text-to-video, image-to-video, text-to-image, and more.",
  alternates: { canonical: "/models" },
  openGraph: {
    title: "Models | SeedanceAPI",
    description:
      "SeedDance video and Seedream image models with USD pricing.",
    url: "/models",
  },
};

export default function ModelsPage() {
  return (
    <div className="paper-grain mx-auto max-w-6xl px-6 py-16">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl">
          <h1 className="font-display text-4xl tracking-tight text-ink">
            Models
          </h1>
          <p className="mt-4 text-ink-soft">
            SeedDance video and Seedream image endpoints. Copy a model ID into{" "}
            <code className="rounded bg-paper-2 px-1.5 py-0.5 font-mono text-xs text-ink">
              {"{ \"model\": \"…\" }"}
            </code>{" "}
            on{" "}
            <code className="rounded bg-paper-2 px-1.5 py-0.5 font-mono text-xs text-ink">
              POST /v1/videos
            </code>{" "}
            or{" "}
            <code className="rounded bg-paper-2 px-1.5 py-0.5 font-mono text-xs text-ink">
              POST /v1/images
            </code>
            .
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/pricing"
            className="inline-flex items-center rounded-full border border-paper-edge bg-white px-4 py-2 text-sm font-medium text-ink-2 transition hover:border-ink-soft hover:bg-paper-2 hover:text-ink"
          >
            Pricing
          </Link>
          <a
            href={getDocsUrl("/models")}
            className="inline-flex items-center rounded-full bg-ink px-4 py-2 text-sm font-medium text-paper transition hover:bg-ink-2"
          >
            Docs
          </a>
        </div>
      </div>

      <div className="mt-12">
        <ModelCatalog showDescription />
      </div>
    </div>
  );
}
