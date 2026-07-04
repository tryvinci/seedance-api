import Link from "next/link";
import { SignedIn, UserButton } from "@clerk/nextjs";
import { getDocsUrl } from "@/lib/docs-url";
import { getAppUrl } from "@/lib/app-url";
import { Logo } from "@/components/logo";
import { NavBalance } from "@/components/nav-balance";
import { GetApiKeyButton } from "@/components/get-api-key-button";

const nav = [
  { href: "/models", label: "Models" },
  { href: "/pricing", label: "Pricing" },
  { href: "/playground", label: "Playground" },
  { href: getDocsUrl(), label: "Docs", external: true },
  { href: "/agents", label: "For Agents" },
];

export function Header() {
  const appUrl = getAppUrl();

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
          <GetApiKeyButton className="rounded-full bg-ink px-4 py-2 text-sm font-medium text-paper transition hover:bg-ink-2" />
          <SignedIn>
            <NavBalance />
            <UserButton
              afterSignOutUrl={appUrl}
              userProfileProps={{
                apiKeysProps: { showDescription: true },
              }}
            />
          </SignedIn>
        </div>
      </div>
    </header>
  );
}
