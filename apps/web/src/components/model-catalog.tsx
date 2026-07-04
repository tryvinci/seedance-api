"use client";

import { useMemo, useState } from "react";
import {
  listModels,
  formatPrice,
  type ModelDefinition,
} from "@seedance/models";
import { CopyButton } from "@/components/copy-button";

type KindFilter = "all" | "video" | "image";

export function ModelCatalog({
  showDescription = true,
  compact = false,
}: {
  showDescription?: boolean;
  compact?: boolean;
}) {
  const all = useMemo(() => listModels(), []);
  const [kind, setKind] = useState<KindFilter>("all");
  const [query, setQuery] = useState("");
  const [family, setFamily] = useState("all");

  const families = useMemo(() => {
    const set = new Set(
      all
        .filter((m) => kind === "all" || m.kind === kind)
        .map((m) => m.family),
    );
    return [...set];
  }, [all, kind]);

  const models = useMemo(() => {
    const q = query.trim().toLowerCase();
    return all.filter((m) => {
      if (kind !== "all" && m.kind !== kind) return false;
      if (family !== "all" && m.family !== family) return false;
      if (!q) return true;
      return (
        m.id.toLowerCase().includes(q) ||
        m.displayName.toLowerCase().includes(q) ||
        m.variant.toLowerCase().includes(q) ||
        m.description.toLowerCase().includes(q)
      );
    });
  }, [all, kind, family, query]);

  const videoCount = all.filter((m) => m.kind === "video").length;
  const imageCount = all.filter((m) => m.kind === "image").length;

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-flex rounded-full border border-paper-edge bg-white p-1">
          {(
            [
              ["all", `All (${all.length})`],
              ["video", `Video (${videoCount})`],
              ["image", `Image (${imageCount})`],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => {
                setKind(value);
                setFamily("all");
              }}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                kind === value
                  ? "bg-ink text-paper"
                  : "text-ink-soft hover:text-ink"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search models…"
          className="w-full rounded-full border border-paper-edge bg-white px-4 py-2 text-sm text-ink outline-none placeholder:text-ink-soft/60 focus:border-accent sm:max-w-xs"
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <FilterChip
          active={family === "all"}
          onClick={() => setFamily("all")}
          label="All families"
        />
        {families.map((f) => (
          <FilterChip
            key={f}
            active={family === f}
            onClick={() => setFamily(f)}
            label={f.replace(/-/g, " ")}
          />
        ))}
      </div>

      <div
        className={`mt-6 overflow-hidden rounded-2xl border border-paper-edge bg-white ${
          compact ? "" : ""
        }`}
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-paper-edge bg-paper-2/40 text-ink-soft">
                <th className="px-4 py-3 font-mono text-[11px] font-medium uppercase tracking-wider">
                  Model endpoint
                </th>
                <th className="px-4 py-3 font-mono text-[11px] font-medium uppercase tracking-wider">
                  Type
                </th>
                <th className="px-4 py-3 font-mono text-[11px] font-medium uppercase tracking-wider">
                  Variant
                </th>
                <th className="px-4 py-3 font-mono text-[11px] font-medium uppercase tracking-wider">
                  Price
                </th>
                <th className="px-4 py-3 font-mono text-[11px] font-medium uppercase tracking-wider">
                  Unit
                </th>
                {showDescription && (
                  <th className="px-4 py-3 font-mono text-[11px] font-medium uppercase tracking-wider">
                    Description
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {models.map((m) => (
                <ModelRow
                  key={m.id}
                  model={m}
                  showDescription={showDescription}
                />
              ))}
              {models.length === 0 && (
                <tr>
                  <td
                    colSpan={showDescription ? 6 : 5}
                    className="px-4 py-8 text-center text-ink-soft"
                  >
                    No models match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-1 text-xs font-medium capitalize transition ${
        active
          ? "bg-accent/10 text-accent"
          : "bg-white text-ink-soft ring-1 ring-paper-edge hover:text-ink"
      }`}
    >
      {label}
    </button>
  );
}

function ModelRow({
  model,
  showDescription,
}: {
  model: ModelDefinition;
  showDescription: boolean;
}) {
  return (
    <tr className="border-b border-paper-edge/70 last:border-0">
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <code className="font-mono text-xs text-accent">{model.id}</code>
          <CopyButton value={model.id} label="Copy" />
        </div>
      </td>
      <td className="px-4 py-3">
        <span
          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
            model.kind === "video"
              ? "bg-ink/5 text-ink-2"
              : "bg-accent/10 text-accent"
          }`}
        >
          {model.kind}
        </span>
      </td>
      <td className="px-4 py-3 text-ink-2">{model.variant}</td>
      <td className="px-4 py-3 font-medium text-ink">
        {formatPrice(model.priceUsd, model.priceUnit)}
      </td>
      <td className="px-4 py-3 text-ink-soft">
        {model.priceUnit === "second" ? "per second" : "per generation"}
      </td>
      {showDescription && (
        <td className="max-w-xs px-4 py-3 text-ink-soft">{model.description}</td>
      )}
    </tr>
  );
}
