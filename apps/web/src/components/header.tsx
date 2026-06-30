import Link from "next/link";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import { getDocsUrl } from "@/lib/docs-url";

const nav = [
  { href: "/models", label: "Models" },
  { href: "/pricing", label: "Pricing" },
  { href: getDocsUrl(), label: "Docs", external: true },
  { href: "/agents", label: "For Agents" },
];

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-paper-edge/80 bg-paper/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link
          href="/"
          className="flex items-center gap-2.5 font-semibold tracking-tight text-ink"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-sm font-bold text-white">
            S
          </span>
          <span className="font-display text-lg">Seedance API</span>
        </Link>

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
          <SignedOut>
            <SignInButton mode="modal">
              <button className="rounded-full border border-paper-edge px-4 py-2 text-sm text-ink-2 transition hover:border-ink-soft hover:bg-paper-2">
                Sign in
              </button>
            </SignInButton>
            <Link
              href={getDocsUrl("/quickstart")}
              className="hidden rounded-full bg-ink px-4 py-2 text-sm font-medium text-paper transition hover:bg-ink-2 lg:inline-block"
            >
              Get started
            </Link>
          </SignedOut>
          <SignedIn>
            <Link
              href="/dashboard"
              className="hidden rounded-full border border-paper-edge px-4 py-2 text-sm transition hover:border-accent hover:text-accent md:inline-block"
            >
              Dashboard
            </Link>
            <UserButton
              afterSignOutUrl="/"
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
