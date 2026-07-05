import posthog from "posthog-js";

export function getPostHogKey(): string {
  return process.env.NEXT_PUBLIC_POSTHOG_KEY?.trim() ?? "";
}

export function getPostHogHost(): string {
  return process.env.NEXT_PUBLIC_POSTHOG_HOST?.trim() || "https://us.i.posthog.com";
}

export function initPostHog() {
  const key = getPostHogKey();
  if (!key || posthog.__loaded) return posthog;
  posthog.init(key, {
    api_host: getPostHogHost(),
    person_profiles: "identified_only",
    capture_pageview: false,
    capture_pageleave: true,
  });
  return posthog;
}

export { posthog };
