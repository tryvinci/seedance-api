"use client";

import { useAuth } from "@clerk/nextjs";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { formatUsd } from "@seedance/models";
import { getApiBaseUrl } from "@/lib/api-base";
import { AccountNav } from "@/components/account-nav";

type Generation = {
  id: string;
  status: string;
  model: string;
  kind: string;
  output_url: string | null;
  price_usd: number;
  error: string | null;
  created_at: string;
};

const PAGE_SIZES = [10, 25, 50] as const;

export function GenerationsClient() {
  const { getToken } = useAuth();
  const [items, setItems] = useState<Generation[]>([]);
  const [total, setTotal] = useState(0);
  const [limit, setLimit] = useState<(typeof PAGE_SIZES)[number]>(25);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<Generation | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await getToken({ skipCache: true });
      if (!token) throw new Error("Not signed in");
      const offset = page * limit;
      const res = await fetch(
        `${getApiBaseUrl()}/v1/generations?limit=${limit}&offset=${offset}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        },
      );
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message ?? data.error ?? "Failed to load");
      }
      setItems(data.data ?? []);
      setTotal(typeof data.total === "number" ? data.total : 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [getToken, limit, page]);

  useEffect(() => {
    load();
  }, [load]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  async function openOutput(gen: Generation) {
    if (gen.status !== "completed") return;
    // Re-fetch latest record in case output_url was filled after list load.
    try {
      const token = await getToken({ skipCache: true });
      if (!token) return;
      const res = await fetch(`${getApiBaseUrl()}/v1/generations/${gen.id}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      const data = await res.json();
      if (res.ok && data.output_url) {
        setPreview({ ...gen, ...data, output_url: data.output_url });
      } else {
        setPreview(gen);
      }
    } catch {
      setPreview(gen);
    }
  }

  return (
    <div className="paper-grain mx-auto max-w-6xl px-6 py-16">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-soft">
            <Link href="/dashboard" className="hover:text-ink">
              Account
            </Link>
            <span className="mx-2">/</span>
            Generations
          </p>
          <h1 className="mt-2 font-display text-4xl tracking-tight text-ink">
            Generations
          </h1>
          <p className="mt-2 max-w-xl text-sm text-ink-soft">
            History for the past{" "}
            <span className="font-medium text-ink">7 days</span> only. Outputs
            expire after about a week — download anything you need to keep.
          </p>
        </div>
        <div className="flex flex-col items-end gap-3">
          <AccountNav />
          <div className="flex items-center gap-2">
            <label
              htmlFor="page-size"
              className="font-mono text-[11px] uppercase tracking-wider text-ink-soft"
            >
              Per page
            </label>
            <select
              id="page-size"
              value={limit}
              onChange={(e) => {
                setPage(0);
                setLimit(Number(e.target.value) as (typeof PAGE_SIZES)[number]);
              }}
              className="rounded-lg border border-paper-edge bg-white px-3 py-2 text-sm text-ink outline-none focus:border-accent"
            >
              {PAGE_SIZES.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="mt-8 overflow-hidden rounded-2xl border border-paper-edge bg-white">
        {loading ? (
          <p className="p-8 text-sm text-ink-soft">Loading…</p>
        ) : error ? (
          <p className="p-8 text-sm text-red-700">{error}</p>
        ) : items.length === 0 ? (
          <p className="p-8 text-sm text-ink-soft">
            No generations in the last 7 days.{" "}
            <Link href="/playground" className="text-accent hover:underline">
              Open playground
            </Link>
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-paper-edge bg-paper/40 text-ink-soft">
                  <th className="px-4 py-3 font-mono text-[11px] font-medium uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-4 py-3 font-mono text-[11px] font-medium uppercase tracking-wider">
                    Model
                  </th>
                  <th className="px-4 py-3 font-mono text-[11px] font-medium uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-4 py-3 font-mono text-[11px] font-medium uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 font-mono text-[11px] font-medium uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-4 py-3 font-mono text-[11px] font-medium uppercase tracking-wider">
                    Output
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((g) => (
                  <tr
                    key={g.id}
                    className="border-b border-paper-edge/80 last:border-0"
                  >
                    <td className="px-4 py-3 text-ink-soft">
                      {new Date(g.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-ink">
                      {g.model}
                    </td>
                    <td className="px-4 py-3 capitalize text-ink-soft">
                      {g.kind}
                    </td>
                    <td className="px-4 py-3">
                      <StatusPill status={g.status} />
                    </td>
                    <td className="px-4 py-3 text-ink">
                      {formatUsd(g.price_usd)}
                    </td>
                    <td className="px-4 py-3">
                      {g.status === "completed" ? (
                        <button
                          type="button"
                          onClick={() => openOutput(g)}
                          className="rounded-full bg-ink px-3 py-1.5 text-xs font-medium text-paper hover:bg-ink-2"
                        >
                          View
                        </button>
                      ) : g.status === "failed" ? (
                        <span
                          className="text-xs text-ink-soft"
                          title={g.error ?? undefined}
                        >
                          {g.error ? "Error" : "—"}
                        </span>
                      ) : (
                        <span className="text-xs text-ink-soft">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {total > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-paper-edge px-4 py-3 text-sm text-ink-soft">
            <p>
              Showing {page * limit + 1}–
              {Math.min((page + 1) * limit, total)} of {total}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 0 || loading}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                className="rounded-full border border-paper-edge px-3 py-1.5 text-ink disabled:opacity-40"
              >
                Previous
              </button>
              <span className="font-mono text-xs">
                {page + 1} / {totalPages}
              </span>
              <button
                type="button"
                disabled={page + 1 >= totalPages || loading}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-full border border-paper-edge px-3 py-1.5 text-ink disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {preview && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/50 p-4"
          onClick={() => setPreview(null)}
          role="presentation"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Generation output"
            className="max-h-[90vh] w-full max-w-3xl overflow-auto rounded-2xl bg-white p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-wider text-ink-soft">
                  Output
                </p>
                <p className="mt-1 font-mono text-xs text-ink">{preview.model}</p>
              </div>
              <button
                type="button"
                onClick={() => setPreview(null)}
                className="rounded-full px-3 py-1 text-sm text-ink-soft hover:bg-paper-2 hover:text-ink"
              >
                Close
              </button>
            </div>
            <div className="mt-4">
              {preview.output_url ? (
                preview.kind === "video" ||
                preview.output_url.includes(".mp4") ? (
                  <video
                    src={preview.output_url}
                    controls
                    className="max-h-[70vh] w-full rounded-xl bg-hero"
                  />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={preview.output_url}
                    alt="Generation output"
                    className="max-h-[70vh] w-full rounded-xl object-contain"
                  />
                )
              ) : (
                <p className="text-sm text-ink-soft">
                  Output is not available (it may have expired after 7 days).
                </p>
              )}
            </div>
            {preview.output_url && (
              <a
                href={preview.output_url}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex rounded-full bg-ink px-4 py-2 text-sm font-medium text-paper hover:bg-ink-2"
              >
                Open / download
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const styles =
    status === "completed"
      ? "bg-emerald-50 text-emerald-800"
      : status === "failed"
        ? "bg-red-50 text-red-800"
        : status === "processing"
          ? "bg-amber-50 text-amber-900"
          : "bg-paper-2 text-ink-soft";
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider ${styles}`}
    >
      {status}
    </span>
  );
}
