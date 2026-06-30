import { CREDIT_PACKS } from "@seedance/models";
import type { Metadata } from "next";
import { BuyCreditsButton } from "@/components/buy-credits-button";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Prepaid credit packs for Seedance API usage.",
};

export default function PricingPage() {
  return (
    <div className="paper-grain mx-auto max-w-6xl px-6 py-16">
      <div className="text-center">
        <h1 className="font-display text-4xl tracking-tight text-ink">
          Simple credit pricing
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-ink-soft">
          Buy credits upfront. Each generation deducts credits based on the
          model. No subscriptions required.
        </p>
      </div>

      <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {CREDIT_PACKS.map((pack, i) => (
          <div
            key={pack.id}
            className={`rounded-2xl border p-6 ${
              i === 1
                ? "border-accent/40 bg-white shadow-lg shadow-accent/5 ring-1 ring-accent/20"
                : "border-paper-edge bg-white"
            }`}
          >
            {i === 1 && (
              <span className="mb-3 inline-block rounded-full bg-accent/10 px-3 py-0.5 font-mono text-[10px] uppercase tracking-wider text-accent">
                Popular
              </span>
            )}
            <h3 className="text-lg font-medium text-ink">{pack.name}</h3>
            <p className="mt-2">
              <span className="font-display text-3xl text-ink">${pack.priceUsd}</span>
            </p>
            <p className="mt-1 text-sm text-ink-soft">
              {pack.credits.toLocaleString()} credits
            </p>
            <p className="mt-1 text-xs text-ink-soft/80">
              ${(pack.priceUsd / pack.credits * 100).toFixed(2)} per 100 credits
            </p>
            <BuyCreditsButton packId={pack.id} className="mt-6 w-full" />
          </div>
        ))}
      </div>

      <div className="mt-16 rounded-2xl border border-paper-edge bg-white p-8">
        <h2 className="font-display text-xl text-ink">Example costs</h2>
        <ul className="mt-4 space-y-2 text-sm text-ink-soft">
          <li>Seedance 2.5 text-to-video — 120 credits</li>
          <li>Seedance 2.0 Fast text-to-video — 80 credits</li>
          <li>Seedance 1.0 Pro text-to-video — 50 credits</li>
          <li>Seedream 5.0 text-to-image — 15 credits</li>
          <li>Seedream 4.0 text-to-image — 8 credits</li>
        </ul>
      </div>
    </div>
  );
}
