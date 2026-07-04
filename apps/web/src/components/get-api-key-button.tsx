"use client";

import Link from "next/link";
import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import { getDashboardUrl } from "@/lib/app-url";

/** Sign-in (or dashboard if already signed in), always returning to SeedanceAPI. */
export function GetApiKeyButton({
  className,
  label = "Get API key",
}: {
  className?: string;
  label?: string;
}) {
  const dashboardUrl = getDashboardUrl();

  return (
    <>
      <SignedOut>
        <SignInButton
          mode="redirect"
          forceRedirectUrl={dashboardUrl}
          signUpForceRedirectUrl={dashboardUrl}
          fallbackRedirectUrl={dashboardUrl}
          signUpFallbackRedirectUrl={dashboardUrl}
        >
          <button type="button" className={className}>
            {label}
          </button>
        </SignInButton>
      </SignedOut>
      <SignedIn>
        <Link href="/dashboard" className={className}>
          {label}
        </Link>
      </SignedIn>
    </>
  );
}
