import { PostHog } from "posthog-node";

function posthogHost(): string {
  return process.env.POSTHOG_HOST?.trim() || "https://us.i.posthog.com";
}

export async function captureServerEvent(
  distinctId: string,
  event: string,
  properties?: Record<string, unknown>,
) {
  const key = process.env.POSTHOG_API_KEY?.trim();
  if (!key) return;

  const client = new PostHog(key, { host: posthogHost() });
  try {
    client.capture({ distinctId, event, properties });
    await client.shutdown();
  } catch (err) {
    console.error("PostHog capture failed:", err);
  }
}
