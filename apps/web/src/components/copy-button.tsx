"use client";

import { useState } from "react";

export function CopyButton({
  value,
  label = "Copy",
  className = "",
}: {
  value: string;
  label?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function onCopy() {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  }

  return (
    <button
      type="button"
      onClick={onCopy}
      disabled={!value}
      className={`inline-flex items-center justify-center rounded-lg border border-paper-edge bg-white px-3 py-1.5 text-xs font-medium text-ink-2 transition hover:border-ink-soft hover:bg-paper-2 hover:text-ink disabled:pointer-events-none disabled:opacity-40 ${className}`}
    >
      {copied ? "Copied" : label}
    </button>
  );
}
