import Image from "next/image";
import Link from "next/link";

export function LogoMark({
  className = "h-8 w-8",
  title = "SeedanceAPI",
}: {
  className?: string;
  title?: string;
}) {
  return (
    <Image
      src="/logo.png"
      alt={title}
      width={40}
      height={40}
      className={`rounded-lg object-contain ${className}`}
      priority
    />
  );
}

export function Logo({
  href = "/",
  showWordmark = true,
  className = "",
  dark = false,
  markClassName = "h-8 w-8",
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
