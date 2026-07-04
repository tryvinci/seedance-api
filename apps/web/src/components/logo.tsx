import Link from "next/link";

export function LogoMark({
  className = "h-8 w-8",
  title,
}: {
  className?: string;
  title?: string;
}) {
  return (
    <span
      className={`inline-flex items-center justify-center rounded-lg bg-accent font-sans text-sm font-bold leading-none text-white ${className}`}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      S
    </span>
  );
}

export function Logo({
  href = "/",
  showWordmark = true,
  className = "",
  dark = false,
  markClassName = "h-8 w-8 text-sm",
}: {
  href?: string | null;
  showWordmark?: boolean;
  className?: string;
  dark?: boolean;
  markClassName?: string;
}) {
  const inner = (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <LogoMark className={markClassName} />
      {showWordmark && (
        <span
          className={`font-display text-lg tracking-tight ${
            dark ? "text-paper" : "text-ink"
          }`}
        >
          SeedanceAPI
        </span>
      )}
    </span>
  );

  if (!href) return inner;
  return (
    <Link
      href={href}
      className="shrink-0 transition opacity-100 hover:opacity-90"
      aria-label="SeedanceAPI home"
    >
      {inner}
    </Link>
  );
}
