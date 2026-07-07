"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const pillBase =
  "inline-flex items-center rounded-full border px-4 py-2 text-sm font-medium transition";
const pillIdle =
  "border-paper-edge bg-white text-ink-2 hover:border-ink-soft hover:bg-paper-2 hover:text-ink";
const pillActive = "border-ink bg-white text-ink";
const btn =
  "inline-flex items-center rounded-full bg-ink px-4 py-2 text-sm font-medium text-paper transition hover:bg-ink-2";

export function AccountNav() {
  const pathname = usePathname();
  const onDashboard = pathname === "/dashboard";
  const onGenerations = pathname === "/generations";

  return (
    <div className="flex flex-wrap gap-2">
      <Link
        href="/dashboard"
        className={`${pillBase} ${onDashboard ? pillActive : pillIdle}`}
        aria-current={onDashboard ? "page" : undefined}
      >
        Account
      </Link>
      <Link href="/generations" className={btn} aria-current={onGenerations ? "page" : undefined}>
        Generations
      </Link>
    </div>
  );
}
