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
  const signedIn = isLoaded && isSignedIn;
  const text = label ?? (signedIn ? "Dashboard" : "Get API key");
  const dashboardUrl = getDashboardUrl();
  const href = signedIn
    ? "/dashboard"
    : `/sign-in?redirect_url=${encodeURIComponent(dashboardUrl)}`;

  return (
    <Link href={href} className={className}>
      {text}
    </Link>
  );
}
