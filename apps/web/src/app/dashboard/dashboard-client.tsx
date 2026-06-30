"use client";

import { APIKeys, useAuth, useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { BuyCreditsButton } from "@/components/buy-credits-button";
import { CREDIT_PACKS } from "@seedance/models";
import { getApiBaseUrl } from "@/lib/api-base";

interface Generation {
  id: string;
  status: string;
  model: string;
  kind: string;
  output_url: string | null;
  credits_cost: number;
  created_at: string;
}

export function DashboardClient() {
  const { userId, getToken } = useAuth();
  const { user } = useUser();
  const [credits, setCredits] = useState<number | null>(null);
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const token = await getToken();
      if (!token) {
        setLoading(false);
        return;
      }
      const apiBase = getApiBaseUrl();
      const headers = { Authorization: `Bearer ${token}` };
      try {
        const [creditsRes, gensRes] = await Promise.all([
          fetch(`${apiBase}/v1/credits`, { headers }).catch(() => null),
          fetch(`${apiBase}/v1/generations`, { headers }).catch(() => null),
        ]);
        if (creditsRes?.ok) {
          const data = await creditsRes.json();
          setCredits(data.credits);
        }
        if (gensRes?.ok) {
          const data = await gensRes.json();
          setGenerations(data.data ?? []);
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [userId, getToken]);

  return (
    <div className="paper-grain mx-auto max-w-6xl px-6 py-16">
      <h1 className="font-display text-3xl text-ink">Dashboard</h1>
      <p className="mt-2 text-ink-soft">
        Welcome, {user?.firstName ?? user?.emailAddresses[0]?.emailAddress}
      </p>

      <div className="mt-10 grid gap-6 md:grid-cols-3">
        <div className="rounded-2xl border border-paper-edge bg-white p-6">
          <p className="font-mono text-[11px] uppercase tracking-wider text-ink-soft">Credit balance</p>
          <p className="mt-2 font-display text-4xl text-accent">
            {loading ? "..." : (credits ?? 0).toLocaleString()}
          </p>
        </div>
        <div className="rounded-2xl border border-paper-edge bg-white p-6 md:col-span-2">
          <p className="text-sm font-medium text-ink">Using your API key</p>
          <p className="mt-2 text-sm text-ink-soft">
            Create a key below, then pass it as a Bearer token on every request:
          </p>
          <pre className="mt-3 overflow-x-auto rounded-lg bg-hero p-3 text-xs font-mono text-white">
            {`Authorization: Bearer ak_...`}
          </pre>
          <p className="mt-2 text-xs text-ink-soft">
            API base: {getApiBaseUrl()}
          </p>
        </div>
      </div>

      <section className="mt-12">
        <h2 className="font-display text-xl text-ink">API keys</h2>
        <p className="mt-2 text-sm text-ink-soft">
          Create, copy, and revoke keys tied to your account. Keys are shown once
          at creation — store them securely.
        </p>
        <div className="mt-6 overflow-hidden rounded-2xl border border-paper-edge bg-white p-4">
          <APIKeys
            appearance={{
              variables: {
                colorBackground: "#fafaf9",
                colorInputBackground: "#f5f5f4",
                colorText: "#181b20",
                colorTextSecondary: "#5c6370",
                colorPrimary: "#2563eb",
                borderRadius: "0.75rem",
              },
            }}
          />
        </div>
      </section>

      <section className="mt-12">
        <h2 className="font-display text-xl text-ink">Buy credits</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {CREDIT_PACKS.map((pack) => (
            <div
              key={pack.id}
              className="rounded-xl border border-paper-edge bg-white p-4"
            >
              <p className="font-medium text-ink">{pack.name}</p>
              <p className="text-sm text-ink-soft">
                {pack.credits.toLocaleString()} credits — ${pack.priceUsd}
              </p>
              <BuyCreditsButton packId={pack.id} className="mt-3" />
            </div>
          ))}
        </div>
      </section>

      <section className="mt-12">
        <h2 className="font-display text-xl text-ink">Webhook endpoint</h2>
        <p className="mt-2 text-sm text-ink-soft">
          Receive generation completion events at your URL.
        </p>
        <div className="mt-4 flex gap-3">
          <input
            type="url"
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
            placeholder="https://your-app.com/webhooks/seedance"
            className="flex-1 rounded-lg border border-paper-edge bg-white px-4 py-2 text-sm text-ink outline-none focus:border-accent"
          />
          <button
            onClick={async () => {
              await fetch("/api/webhooks/configure", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url: webhookUrl }),
              });
            }}
            className="rounded-full bg-ink px-4 py-2 text-sm text-paper transition hover:bg-ink-2"
          >
            Save
          </button>
        </div>
      </section>

      <section className="mt-12">
        <h2 className="font-display text-xl text-ink">Recent generations</h2>
        {generations.length === 0 ? (
          <p className="mt-4 text-sm text-ink-soft">
            No generations yet. Create an API key above and make your first call.
          </p>
        ) : (
          <div className="mt-4 overflow-hidden rounded-xl border border-paper-edge bg-white">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-paper-edge bg-paper-2/50">
                <tr>
                  <th className="px-4 py-3 text-ink-soft">ID</th>
                  <th className="px-4 py-3 text-ink-soft">Model</th>
                  <th className="px-4 py-3 text-ink-soft">Status</th>
                  <th className="px-4 py-3 text-ink-soft">Credits</th>
                </tr>
              </thead>
              <tbody>
                {generations.map((g) => (
                  <tr key={g.id} className="border-b border-paper-edge/80">
                    <td className="px-4 py-3 font-mono text-xs text-ink-2">{g.id.slice(0, 8)}...</td>
                    <td className="px-4 py-3 text-ink">{g.model}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs ${
                          g.status === "completed"
                            ? "bg-accent/10 text-accent"
                            : g.status === "failed"
                              ? "bg-red-100 text-red-600"
                              : "bg-paper-2 text-ink-soft"
                        }`}
                      >
                        {g.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-ink">{g.credits_cost}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
