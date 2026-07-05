import type { Metadata } from "next";
import { CREDIT_PACKS, formatUsd } from "@seedance/models";
import { BuyCreditsButton } from "@/components/buy-credits-button";
import { ModelCatalog } from "@/components/model-catalog";
import { UsageCalculator } from "@/components/usage-calculator";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Pay-as-you-go USD pricing for SeedDance video and Seedream image generation. Prepaid balance, billed per second or per generation.",
  alternates: { canonical: "/pricing" },
  openGraph: {
    title: "Pricing | SeedanceAPI",
    description:
      "Prepaid USD balance for SeedDance video and Seedream image models.",
    url: "/pricing",
  },
};

export default function PricingPage() {
  return (
    <div className="paper-grain mx-auto max-w-6xl px-6 py-16">
      <div className="max-w-2xl">
        <h1 className="font-display text-4xl tracking-tight text-ink">
          Pricing
        </h1>
        <p className="mt-4 text-ink-soft">
          Prepaid USD balance. Each generation is charged at the model list
          price. No subscriptions.
        </p>
      </div>

      {/* Prepaid packs */}
      <section className="mt-12">
        <h2 className="font-display text-2xl text-ink">Prepaid balance</h2>
        <p className="mt-2 text-sm text-ink-soft">
          Top up once, spend across any model.
        </p>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {CREDIT_PACKS.map((pack, i) => {
            const popular = i === 1;
            return (
              <div
                key={pack.id}
                className={`relative flex flex-col rounded-2xl border bg-white p-6 pt-8 ${
                  popular
                    ? "border-accent/40 shadow-lg shadow-accent/5 ring-1 ring-accent/15"
                    : "border-paper-edge"
                }`}
              >
                {popular && (
                  <span className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent px-3 py-1 font-mono text-[10px] font-medium uppercase tracking-wider text-white">
                    Popular
                  </span>
                )}
                <h3 className="text-lg font-medium text-ink">{pack.name}</h3>
                <p className="mt-3 font-display text-4xl tracking-tight text-ink">
                  {formatUsd(pack.priceUsd)}
                </p>
                <p className="mt-1 text-sm text-ink-soft">Prepaid balance</p>
                <div className="mt-auto pt-6">
                  <BuyCreditsButton packId={pack.id} label="Buy" />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Calculator */}
      <section className="mt-16">
        <UsageCalculator />
      </section>

      {/* Model pricing */}
      <section className="mt-16">
        <div className="mb-8 max-w-2xl">
          <h2 className="font-display text-2xl text-ink">Model pricing</h2>
          <p className="mt-2 text-sm text-ink-soft">
            Video is billed per second; images per generation. Filter by type,
            then copy the model endpoint for your API calls.
          </p>
        </div>
        <ModelCatalog showDescription={false} />
      </section>
    </div>
  );
}
