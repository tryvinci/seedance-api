"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { getAppUrl, getDashboardUrl } from "@/lib/app-url";
import { clerkAppearance } from "@/lib/clerk-appearance";
import { PostHogIdentify } from "@/components/posthog-identify";
import { PostHogProvider } from "@/components/posthog-provider";

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

  const content = !key ? (
    children
  ) : (
    <ClerkProvider
      publishableKey={key}
      appearance={clerkAppearance}
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      signInFallbackRedirectUrl={dashboardUrl}
      signUpFallbackRedirectUrl={dashboardUrl}
      afterSignOutUrl={appUrl}
    >
      <PostHogIdentify />
      {children}
    </ClerkProvider>
  );

  return <PostHogProvider>{content}</PostHogProvider>;
}
