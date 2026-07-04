import Link from "next/link";

const legalNav = [
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms of Service" },
  { href: "/refunds", label: "Refund Policy" },
];

export function LegalPage({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: React.ReactNode;
}) {
  return (
    <div className="paper-grain mx-auto max-w-3xl px-6 py-16">
      <nav className="mb-10 flex flex-wrap gap-x-4 gap-y-2 font-mono text-[11px] uppercase tracking-[0.12em] text-ink-soft">
        {legalNav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="hover:text-ink"
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <h1 className="font-display text-4xl tracking-tight text-ink">{title}</h1>
      <p className="mt-3 text-sm text-ink-soft">Last updated: {updated}</p>
      <div className="prose-site mt-10 space-y-6 text-[15px] leading-relaxed text-ink-2">
        {children}
      </div>
    </div>
  );
}

export function LegalSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="font-display text-xl tracking-tight text-ink">{title}</h2>
      <div className="mt-3 space-y-3 text-ink-soft">{children}</div>
    </section>
  );
}
