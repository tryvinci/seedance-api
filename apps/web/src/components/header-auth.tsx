"use client";

import Link from "next/link";
import { UserButton, useAuth } from "@clerk/nextjs";
import { getAppUrl, getDashboardUrl } from "@/lib/app-url";
import { NavBalance } from "@/components/nav-balance";

const btnClass =
  "rounded-full bg-ink px-4 py-2 text-sm font-medium text-paper transition hover:bg-ink-2";

function signInHref() {
  const dashboardUrl = getDashboardUrl();
  return `/sign-in?redirect_url=${encodeURIComponent(dashboardUrl)}`;
}

/** Auth controls — only uses Clerk hooks when a publishable key is present. */
export function HeaderAuth() {
  const key = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  if (!key) {
    return (
      <Link href={signInHref()} className={btnClass}>
        Get API key
      </Link>
    );
  }
  return <HeaderAuthInner />;
}

function HeaderAuthInner() {
  const { isLoaded, isSignedIn } = useAuth();
  const appUrl = getAppUrl();
  const href = signInHref();

  if (!isLoaded || !isSignedIn) {
    return (
      <Link href={href} className={btnClass}>
        Get API key
      </Link>
    );
  }

  return (
    <>
      <NavBalance />
      <Link href="/dashboard" className={btnClass}>
        Dashboard
      </Link>
      <UserButton
        afterSignOutUrl={appUrl}
        userProfileProps={{
          apiKeysProps: { showDescription: true },
        }}
      />
    </>
  );
}

/** Hero / marketing CTA */
export function GetApiKeyButton({
  className,
  label,
}: {
  className?: string;
  label?: string;
}) {
  const key = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  if (!key) {
    return (
      <Link href={signInHref()} className={className}>
        {label ?? "Get API key"}
      </Link>
    );
  }
  return <GetApiKeyButtonInner className={className} label={label} />;
}

function GetApiKeyButtonInner({
  className,
  label,
}: {
  className?: string;
  label?: string;
}) {
  const { isLoaded, isSignedIn } = useAuth();

  if (isLoaded && isSignedIn) {
    return (
      <Link href="/dashboard" className={className}>
        {label ?? "Dashboard"}
      </Link>
    );
  }

  return (
    <Link href={signInHref()} className={className}>
      {label ?? "Get API key"}
    </Link>
  );
}
