"use client";

import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { getDashboardUrl } from "@/lib/app-url";

/**
 * Always renders a visible CTA. Uses a plain Link (not Clerk SignInButton),
 * which can render nothing on a shared Clerk instance.
 */
export function GetApiKeyButton({
  className,
  label,
}: {
  className?: string;
  label?: string;
}) {
  const { isLoaded, isSignedIn } = useAuth();
  const dashboardUrl = getDashboardUrl();

  // While Clerk loads, still show a working link (sign-in auto-forwards if session exists).
  if (!isLoaded) {
    return (
      <Link
        href={`/sign-in?redirect_url=${encodeURIComponent(dashboardUrl)}`}
        className={className}
      >
        {label ?? "Get API key"}
      </Link>
    );
  }

  if (isSignedIn) {
    return (
      <Link href="/dashboard" className={className}>
        {label ?? "Dashboard"}
      </Link>
    );
  }

  return (
    <Link
      href={`/sign-in?redirect_url=${encodeURIComponent(dashboardUrl)}`}
      className={className}
    >
      {label ?? "Get API key"}
    </Link>
  );
}
