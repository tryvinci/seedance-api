"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { PostHogProvider as PHProvider } from "posthog-js/react";
import { Suspense, useEffect } from "react";
import { initPostHog, posthog, getPostHogKey } from "@/lib/posthog";

function PostHogPageviews() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!getPostHogKey()) return;
    initPostHog();
    const url = searchParams?.size
      ? `${pathname}?${searchParams.toString()}`
      : pathname;
    posthog.capture("$pageview", { $current_url: url });
  }, [pathname, searchParams]);

  return null;
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  if (!getPostHogKey()) return <>{children}</>;

  initPostHog();

  return (
    <PHProvider client={posthog}>
      <Suspense fallback={null}>
        <PostHogPageviews />
      </Suspense>
      {children}
    </PHProvider>
  );
}
