"use client";

import { useAuth, useUser } from "@clerk/nextjs";
import { useEffect } from "react";
import { getPostHogKey, initPostHog, posthog } from "@/lib/posthog";

export function PostHogIdentify() {
  const { isSignedIn, userId } = useAuth();
  const { user } = useUser();

  useEffect(() => {
    if (!getPostHogKey()) return;
    initPostHog();

    if (isSignedIn && userId) {
      posthog.identify(userId, {
        email: user?.primaryEmailAddress?.emailAddress,
      });
    } else {
      posthog.reset();
    }
  }, [isSignedIn, userId, user?.primaryEmailAddress?.emailAddress]);

  return null;
}
