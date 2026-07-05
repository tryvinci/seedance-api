"use client";

import { useState } from "react";
import { CREDIT_PACKS } from "@seedance/models";
import { getPostHogKey, initPostHog, posthog } from "@/lib/posthog";

export function BuyCreditsButton({
  packId,
  label = "Buy",
  variant = "primary",
  className = "",
}: {
  packId: string;
  label?: string;
  variant?: "primary" | "secondary";
  className?: string;
}) {
  const [loading, setLoading] = useState(false);

  async function handleBuy() {
    setLoading(true);
    const pack = CREDIT_PACKS.find((p) => p.id === packId);
    if (getPostHogKey()) {
      initPostHog();
      posthog.capture("checkout_started", {
        pack_id: packId,
        amount_usd: pack?.priceUsd,
      });
    }
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packId }),
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
      setLoading(false);
    }
  }

  const styles =
    variant === "primary"
      ? "bg-ink text-paper hover:bg-ink-2"
      : "border border-paper-edge bg-white text-ink hover:border-ink-soft hover:bg-paper-2";

  return (
    <button
      type="button"
      onClick={handleBuy}
      disabled={loading}
      className={`inline-flex w-full items-center justify-center rounded-full px-4 py-2.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${styles} ${className}`}
    >
      {loading ? "Working…" : label}
    </button>
  );
}
