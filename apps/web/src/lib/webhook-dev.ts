/** Dummy secrets for local dev — signature verification is skipped (non-production only). */
export const DEV_CLERK_WEBHOOK_SECRET = "whsec_dev_dummy";
export const DEV_DODO_WEBHOOK_SECRET = "dodo_dev_dummy";

export function isDevWebhookBypass(
  secret: string | undefined,
  kind: "clerk" | "dodo",
): boolean {
  if (process.env.NODE_ENV === "production") return false;
  if (process.env.WEBHOOK_VERIFY === "true") return false;
  if (!secret) return false;
  return kind === "clerk"
    ? secret === DEV_CLERK_WEBHOOK_SECRET
    : secret === DEV_DODO_WEBHOOK_SECRET;
}
