"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { getAppUrl, getDashboardUrl } from "@/lib/app-url";

export function Providers({
  children,
  publishableKey,
}: {
  children: React.ReactNode;
  /** From the server when available; client also reads NEXT_PUBLIC_*. */
  publishableKey?: string;
}) {
  const key =
    publishableKey || process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || "";
  const appUrl = getAppUrl();
  const dashboardUrl = getDashboardUrl();

  if (!key) {
    return <>{children}</>;
  }

  return (
    <ClerkProvider
      publishableKey={key}
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      signInFallbackRedirectUrl={dashboardUrl}
      signUpFallbackRedirectUrl={dashboardUrl}
      afterSignOutUrl={appUrl}
    >
      {children}
    </ClerkProvider>
  );
}
