"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { BuyCreditsButton } from "@/components/buy-credits-button";
import { CREDIT_PACKS, formatUsd } from "@seedance/models";

export function AddBalanceModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [customAmount, setCustomAmount] = useState("25");
  const [customLoading, setCustomLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  async function buyCustom() {
    const amountUsd = Number(customAmount);
    if (!Number.isFinite(amountUsd) || amountUsd < 5) {
      alert("Minimum top-up is $5");
      return;
    }
    setCustomLoading(true);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amountUsd }),
      });
      const data = await res.json();
      if (data.credited) {
        window.location.href = "/dashboard?payment=success";
        return;
      }
      if (data.checkout_url) {
        window.location.href = data.checkout_url;
        return;
      }
      alert(data.error ?? "Checkout failed");
    } catch {
      alert("Checkout failed");
    } finally {
      setCustomLoading(false);
    }
  }

  if (!open || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] overflow-y-auto">
      <div
        className="fixed inset-0 bg-ink/50"
        onClick={onClose}
        aria-hidden
      />
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-balance-title"
          className="relative z-[101] w-full max-w-md rounded-2xl border border-paper-edge bg-white p-6 shadow-2xl"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2
                id="add-balance-title"
                className="font-display text-xl text-ink"
              >
                Add balance
              </h2>
              <p className="mt-1 text-sm text-ink-soft">
                Prepaid USD for API usage.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-2 py-1 text-ink-soft transition hover:bg-paper-2 hover:text-ink"
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            {CREDIT_PACKS.map((pack, i) => (
              <div
                key={pack.id}
                className={`rounded-xl border p-3 ${
                  i === 1
                    ? "border-accent/30 bg-accent/[0.03]"
                    : "border-paper-edge"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-ink">{pack.name}</p>
                  {i === 1 && (
                    <span className="rounded-full bg-accent/10 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-accent">
                      Popular
                    </span>
                  )}
                </div>
                <p className="mt-1 font-display text-xl text-ink">
                  {formatUsd(pack.priceUsd)}
                </p>
                <div className="mt-3">
                  <BuyCreditsButton packId={pack.id} label="Buy" />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 border-t border-paper-edge pt-5">
            <label
              htmlFor="nav-custom-amount"
              className="text-sm font-medium text-ink"
            >
              Custom amount
            </label>
            <div className="mt-2 flex gap-2">
              <div className="relative min-w-0 flex-1">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-ink-soft">
                  $
                </span>
                <input
                  id="nav-custom-amount"
                  type="number"
                  min={5}
                  max={10000}
                  step={1}
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  className="w-full rounded-xl border border-paper-edge bg-paper/40 py-2.5 pl-7 pr-3 text-sm text-ink outline-none focus:border-accent focus:bg-white"
                />
              </div>
              <button
                type="button"
                onClick={buyCustom}
                disabled={customLoading}
                className="shrink-0 rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-paper transition hover:bg-ink-2 disabled:opacity-50"
              >
                {customLoading ? "…" : "Continue"}
              </button>
            </div>
            <p className="mt-2 text-xs text-ink-soft">Minimum $5</p>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
