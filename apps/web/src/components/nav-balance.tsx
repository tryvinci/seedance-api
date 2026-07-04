"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { AddBalanceModal } from "@/components/add-balance-modal";
import { formatUsd } from "@seedance/models";
import { getApiBaseUrl } from "@/lib/api-base";

export function NavBalance() {
  const { userId, getToken, isSignedIn } = useAuth();
  const [balanceUsd, setBalanceUsd] = useState<number | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!isSignedIn) {
      setBalanceUsd(null);
      return;
    }
    async function load() {
      const token = await getToken();
      if (!token) return;
      try {
        const res = await fetch(`${getApiBaseUrl()}/v1/credits`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setBalanceUsd(data.balance_usd ?? 0);
        }
      } catch {
        /* ignore */
      }
    }
    load();
  }, [isSignedIn, userId, getToken]);

  if (!isSignedIn) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="hidden items-center gap-2 rounded-full border border-paper-edge bg-white px-3 py-1.5 text-sm transition hover:border-accent/40 hover:bg-paper-2 sm:inline-flex"
        title="Add balance"
      >
        <span className="font-mono text-[10px] uppercase tracking-wider text-ink-soft">
          Balance
        </span>
        <span className="font-medium text-ink">
          {balanceUsd == null ? "—" : formatUsd(balanceUsd)}
        </span>
        <span className="rounded-full bg-ink px-2 py-0.5 text-[11px] font-medium text-paper">
          +
        </span>
      </button>
      <AddBalanceModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
