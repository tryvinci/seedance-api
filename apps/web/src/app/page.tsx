import Link from "next/link";
import { listModels, listFamilies } from "@seedance/models";
import { getDocsUrl } from "@/lib/docs-url";

export default function HomePage() {
  const families = listFamilies();
  const videoCount = listModels({ kind: "video" }).length;
  const imageCount = listModels({ kind: "image" }).length;

  return (
    <>
      <section className="px-3 pb-3 pt-4 sm:px-4">
        <div className="relative mx-auto max-w-[1200px] overflow-hidden rounded-[28px] bg-hero">
          <div
            className="absolute inset-0 bg-cover bg-center opacity-60"
            style={{
              backgroundImage:
                "radial-gradient(ellipse at 50% 0%, hsl(213 94% 68% / 0.35), transparent 60%), radial-gradient(ellipse at 80% 20%, hsl(221 83% 50% / 0.2), transparent 50%)",
            }}
            aria-hidden
          />
          <div className="absolute inset-0 bg-black/20" aria-hidden />
          <div className="relative mx-auto max-w-4xl px-6 pb-20 pt-24 text-center sm:pt-28">
            <p className="mb-6 inline-block rounded-full border border-white/20 bg-white/10 px-4 py-1.5 font-mono text-[11px] uppercase tracking-[0.12em] text-white/85">
              SeedDance 2.5 &amp; Seedream
            </p>
            <h1 className="font-display text-[clamp(2.5rem,7vw,4.5rem)] leading-[1.05] tracking-tight text-white">
              The API for{" "}
              <span className="italic">SeedDance</span> &amp; Seedream
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-white/75">
              Production-ready REST API for cinematic video and image generation.
              Prepaid credits, MCP access, and full API documentation.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <a
                href={getDocsUrl("/quickstart")}
                className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-medium text-hero transition hover:bg-white/90"
              >
                Get started
              </a>
              <Link
                href="/models"
                className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-6 py-3 text-sm font-medium text-white backdrop-blur-sm transition hover:bg-white/20"
              >
                Browse models
              </Link>
            </div>
            <div className="mx-auto mt-16 grid max-w-lg grid-cols-3 gap-6 text-center">
              <div>
                <p className="font-display text-3xl text-white">{videoCount}</p>
                <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-white/50">Video</p>
              </div>
              <div>
                <p className="font-display text-3xl text-white">{imageCount}</p>
                <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-white/50">Image</p>
              </div>
              <div>
                <p className="font-display text-3xl text-white">{families.length}</p>
                <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-white/50">Families</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="paper-grain px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center font-display text-4xl tracking-tight text-ink">
            Model families
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-center text-ink-soft">
            Every SeedDance and Seedream variant with transparent credit pricing.
          </p>
          <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {families.map((family) => {
              const models = listModels({ family });
              const kind = models[0]?.kind;
              return (
                <Link
                  key={family}
                  href={`/models#${family}`}
                  className="group rounded-2xl border border-paper-edge bg-white p-6 transition hover:border-accent/30 hover:shadow-lg hover:shadow-accent/5"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium capitalize text-ink">
                      {family.replace(/-/g, " ")}
                    </h3>
                    <span className="rounded-full bg-paper-2 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-ink-soft">
                      {kind}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-ink-soft">
                    {models.length} variant{models.length !== 1 ? "s" : ""}
                  </p>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-t border-paper-edge px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center font-display text-4xl tracking-tight text-ink">
            Quick start
          </h2>
          <pre className="mt-8 overflow-x-auto rounded-2xl border border-paper-edge bg-hero p-6 text-sm leading-relaxed text-white">
            <code className="font-mono">{`curl -X POST https://api.seedanceapi.us/v1/videos \\
  -H "Authorization: Bearer ak_YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "seedance-2.5/text-to-video",
    "prompt": "Cinematic drone shot over misty mountains at dawn",
    "aspect_ratio": "16:9",
    "resolution": "720p",
    "duration": 5
  }'`}</code>
          </pre>
          <p className="mt-4 text-center text-sm text-ink-soft">
            Full guide in{" "}
            <a href={getDocsUrl("/quickstart")} className="text-accent hover:underline">
              the docs
            </a>
          </p>
        </div>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            name: "Seedance API",
            applicationCategory: "DeveloperApplication",
            operatingSystem: "Web",
            offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
            url: "https://seedanceapi.us",
          }),
        }}
      />
    </>
  );
}
