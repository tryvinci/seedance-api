import { PostHog } from "posthog-node";
import { creditsToUsd } from "@seedance/models";

type AnalyticsEnv = {
  POSTHOG_API_KEY?: string;
  POSTHOG_HOST?: string;
};

function posthogHost(env: AnalyticsEnv): string {
  return env.POSTHOG_HOST?.trim() || "https://us.i.posthog.com";
}

function createClient(env: AnalyticsEnv): PostHog | null {
  const key = env.POSTHOG_API_KEY?.trim();
  if (!key) return null;
  return new PostHog(key, { host: posthogHost(env) });
}

async function captureAndShutdown(
  client: PostHog,
  distinctId: string,
  event: string,
  properties?: Record<string, unknown>,
) {
  client.capture({ distinctId, event, properties });
  await client.shutdown();
}

/** Fire-and-forget for request handlers (uses waitUntil when available). */
export function trackEvent(
  env: AnalyticsEnv,
  waitUntil: ((promise: Promise<unknown>) => void) | undefined,
  distinctId: string,
  event: string,
  properties?: Record<string, unknown>,
) {
  const client = createClient(env);
  if (!client) return;

  const work = captureAndShutdown(client, distinctId, event, properties).catch(
    (err) => console.error("PostHog capture failed:", err),
  );

  if (waitUntil) waitUntil(work);
}

/** Await in workflows / background steps. */
export async function trackEventAwait(
  env: AnalyticsEnv,
  distinctId: string,
  event: string,
  properties?: Record<string, unknown>,
) {
  const client = createClient(env);
  if (!client) return;
  try {
    await captureAndShutdown(client, distinctId, event, properties);
  } catch (err) {
    console.error("PostHog capture failed:", err);
  }
}

export function generationEventProps(input: {
  generationId: string;
  model: string;
  kind: string;
  provider?: string | null;
  creditsCost: number;
  providerCostCredits?: number | null;
  duration?: number;
  status?: string;
  error?: string | null;
}) {
  const revenueUsd = creditsToUsd(input.creditsCost);
  const providerCostUsd =
    input.providerCostCredits != null
      ? creditsToUsd(input.providerCostCredits)
      : null;
  return {
    generation_id: input.generationId,
    model: input.model,
    kind: input.kind,
    provider: input.provider ?? undefined,
    revenue_usd: revenueUsd,
    provider_cost_usd: providerCostUsd,
    margin_usd:
      providerCostUsd != null
        ? Math.round((revenueUsd - providerCostUsd) * 100) / 100
        : null,
    credits: input.creditsCost,
    duration_seconds: input.duration,
    status: input.status,
    error: input.error ?? undefined,
  };
}
