"use client";

import { useMemo, useState } from "react";
import {
  listModels,
  formatUsd,
  formatPrice,
  chargeUsd,
  CREDIT_PACKS,
} from "@seedance/models";

export function UsageCalculator() {
  const models = useMemo(() => listModels(), []);
  const [kind, setKind] = useState<"video" | "image">("video");
  const filtered = models.filter((m) => m.kind === kind);
  const [modelId, setModelId] = useState(filtered[0]?.id ?? "");
  const [quantity, setQuantity] = useState(10);
  const [duration, setDuration] = useState(5);

  const model = models.find((m) => m.id === modelId) ?? filtered[0];
  const perCall =
    model?.priceUnit === "second"
      ? chargeUsd(model, { duration })
      : (model?.priceUsd ?? 0);
  const total = perCall * Math.max(0, quantity);

  const packFit = CREDIT_PACKS.map((pack) => ({
    ...pack,
    gens: perCall > 0 ? Math.floor(pack.priceUsd / perCall) : 0,
  }));

  return (
    <div className="rounded-2xl border border-paper-edge bg-white p-6 sm:p-8">
      <h2 className="font-display text-2xl text-ink">Usage calculator</h2>
      <p className="mt-2 text-sm text-ink-soft">
        Video is billed per second; images per generation.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <label className="block text-sm">
          <span className="font-medium text-ink">Type</span>
          <select
            value={kind}
            onChange={(e) => {
              const next = e.target.value as "video" | "image";
              setKind(next);
              const first = models.find((m) => m.kind === next);
              if (first) setModelId(first.id);
            }}
            className="mt-1.5 w-full rounded-xl border border-paper-edge bg-paper/40 px-3 py-2.5 text-ink outline-none focus:border-accent focus:bg-white"
          >
            <option value="video">Video</option>
            <option value="image">Image</option>
          </select>
        </label>

        <label className="block text-sm sm:col-span-2">
          <span className="font-medium text-ink">Model</span>
          <select
            value={model?.id ?? ""}
            onChange={(e) => setModelId(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-paper-edge bg-paper/40 px-3 py-2.5 font-mono text-sm text-ink outline-none focus:border-accent focus:bg-white"
          >
            {filtered.map((m) => (
              <option key={m.id} value={m.id}>
                {m.id} — {formatPrice(m.priceUsd, m.priceUnit)}
              </option>
            ))}
          </select>
        </label>

        {model?.priceUnit === "second" && (
          <label className="block text-sm">
            <span className="font-medium text-ink">Seconds each</span>
            <input
              type="number"
              min={3}
              max={15}
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value) || 5)}
              className="mt-1.5 w-full rounded-xl border border-paper-edge bg-paper/40 px-3 py-2.5 text-ink outline-none focus:border-accent focus:bg-white"
            />
          </label>
        )}

        <label className="block text-sm">
          <span className="font-medium text-ink">Generations</span>
          <input
            type="number"
            min={1}
            max={10000}
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value) || 0)}
            className="mt-1.5 w-full rounded-xl border border-paper-edge bg-paper/40 px-3 py-2.5 text-ink outline-none focus:border-accent focus:bg-white"
          />
        </label>

        <div className="flex flex-col justify-end rounded-xl border border-paper-edge bg-paper/30 px-4 py-3 sm:col-span-2">
          <p className="font-mono text-[11px] uppercase tracking-wider text-ink-soft">
            Estimated total
          </p>
          <p className="mt-1 font-display text-3xl text-ink">
            {formatUsd(total)}
          </p>
          <p className="mt-1 text-xs text-ink-soft">
            {quantity} × {formatUsd(perCall)}
            {model?.priceUnit === "second"
              ? ` (${duration}s × ${formatPrice(model.priceUsd, "second")})`
              : " / generation"}
          </p>
        </div>
      </div>

      <div className="mt-6 border-t border-paper-edge pt-5">
        <p className="text-sm font-medium text-ink">
          Generations per prepaid pack
        </p>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {packFit.map((pack) => (
            <div
              key={pack.id}
              className="rounded-xl border border-paper-edge bg-paper/30 px-3 py-3"
            >
              <p className="text-xs text-ink-soft">{pack.name}</p>
              <p className="mt-1 font-display text-lg text-ink">
                {pack.gens.toLocaleString()}
              </p>
              <p className="text-xs text-ink-soft">
                for {formatUsd(pack.priceUsd)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
