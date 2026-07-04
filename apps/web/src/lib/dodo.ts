/** Dodo Payments API hosts (see docs.dodopayments.com). */
export function getDodoApiBase(): string {
  const env = (process.env.DODO_PAYMENTS_ENV ?? "").toLowerCase();
  if (env === "live" || env === "live_mode") {
    return "https://live.dodopayments.com";
  }
  if (env === "test" || env === "test_mode") {
    return "https://test.dodopayments.com";
  }
  // Production defaults to live so a live API key is not sent to the test host.
  return process.env.NODE_ENV === "production"
    ? "https://live.dodopayments.com"
    : "https://test.dodopayments.com";
}

/**
 * Standard Webhooks secret: optional `whsec_` prefix + base64 key material.
 * Falls back to UTF-8 bytes for plain secrets.
 */
function decodeWebhookSecret(secret: string): ArrayBuffer {
  const raw = secret.startsWith("whsec_") ? secret.slice(6) : secret;
  try {
    const bin = atob(raw);
    if (bin.length > 0) {
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      return bytes.buffer;
    }
  } catch {
    /* not base64 */
  }
  return new TextEncoder().encode(secret).buffer;
}

/** Verify Dodo webhook signatures (Standard Webhooks). */
export async function verifyDodoWebhook(
  payload: string,
  headers: Headers,
  secret: string,
): Promise<boolean> {
  const msgId = headers.get("webhook-id");
  const timestamp = headers.get("webhook-timestamp");
  const signature = headers.get("webhook-signature");
  if (!msgId || !timestamp || !signature) return false;

  const age = Math.abs(Date.now() / 1000 - Number(timestamp));
  if (!Number.isFinite(age) || age > 300) return false;

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    decodeWebhookSecret(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const toSign = `${msgId}.${timestamp}.${payload}`;
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(toSign));
  const expected = btoa(String.fromCharCode(...new Uint8Array(sig)));

  return signature.split(" ").some((part) => {
    const [, value] = part.split(",");
    return value === expected;
  });
}
