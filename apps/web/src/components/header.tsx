import Link from "next/link";
import { getDocsUrl } from "@/lib/docs-url";
import { Logo } from "@/components/logo";
import { HeaderAuth } from "@/components/header-auth";

const nav = [
  { href: "/models", label: "Models" },
  { href: "/pricing", label: "Pricing" },
  { href: "/playground", label: "Playground" },
  { href: getDocsUrl(), label: "Docs", external: true },
  { href: "/agents", label: "For Agents" },
];

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-paper-edge/80 bg-paper/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Logo />

        <nav className="hidden items-center gap-1 md:flex">
          {nav.map((item) =>
            item.external ? (
              <a
                key={item.href}
                href={item.href}
                className="rounded-full px-4 py-2 font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-ink-soft transition hover:bg-paper-2 hover:text-ink"
              >
                {item.label}
              </a>
            ) : (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-full px-4 py-2 font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-ink-soft transition hover:bg-paper-2 hover:text-ink"
              >
                {item.label}
              </Link>
            ),
          )}
        </nav>

        <div className="flex items-center gap-3">
          <a
            href={getDocsUrl()}
            className="hidden rounded-full px-4 py-2 text-sm text-ink-soft transition hover:bg-paper-2 hover:text-ink sm:inline-block"
          >
            Docs
          </a>
          <HeaderAuth />
        </div>
      </div>
    </header>
  );
}
