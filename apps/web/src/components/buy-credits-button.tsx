"use client";

import { useState } from "react";

export function BuyCreditsButton({
  packId,
  className,
}: {
  packId: string;
  className?: string;
}) {
  const [loading, setLoading] = useState(false);

  async function handleBuy() {
    setLoading(true);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packId }),
      });
      const data = await res.json();
      if (data.checkout_url) {
        window.location.href = data.checkout_url;
      } else {
        alert(data.error ?? "Checkout failed");
      }
    } catch {
      alert("Checkout failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleBuy}
      disabled={loading}
      className={`rounded-full bg-ink py-2.5 text-sm font-medium text-paper transition hover:bg-ink-2 disabled:opacity-50 ${className ?? ""}`}
    >
      {loading ? "Loading..." : "Buy credits"}
    </button>
  );
}
