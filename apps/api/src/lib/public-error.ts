/**
 * Map internal/provider errors to user-facing messages.
 * Never expose WaveSpeed, ModelArk, BytePlus, or other upstream branding.
 */
export function publicErrorMessage(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err ?? "");
  const msg = raw.toLowerCase();

  if (
    msg.includes("insufficient") ||
    msg.includes("not enough credit") ||
    msg.includes("balance")
  ) {
    return "Insufficient balance for this generation.";
  }
  if (
    msg.includes("unauthorized") ||
    msg.includes("401") ||
    msg.includes("forbidden") ||
    msg.includes("403") ||
    msg.includes("invalid api key") ||
    msg.includes("authentication")
  ) {
    return "Authentication failed. Check your API key and try again.";
  }
  if (msg.includes("429") || msg.includes("rate limit") || msg.includes("too many")) {
    return "Too many requests. Please wait a moment and try again.";
  }
  if (msg.includes("timeout") || msg.includes("timed out") || msg.includes("deadline")) {
    return "Generation timed out. Please try again.";
  }
  if (
    msg.includes("invalid") ||
    msg.includes("bad request") ||
    msg.includes("400") ||
    msg.includes("validation")
  ) {
    return "Invalid request. Check your parameters and try again.";
  }
  if (
    msg.includes("model not found") ||
    msg.includes("unknown model") ||
    msg.includes("no provider available")
  ) {
    return "Requested model is not available. Try another model.";
  }
  if (msg.includes("poll failed") || msg.includes("failed to fetch output")) {
    return "Could not retrieve generation output. Please try again.";
  }
  if (
    msg.includes("content") ||
    msg.includes("moderation") ||
    msg.includes("safety") ||
    msg.includes("policy") ||
    msg.includes("nsfw")
  ) {
    return "This request could not be completed due to content policy.";
  }
  if (msg.includes("unavailable") || msg.includes("503") || msg.includes("502")) {
    return "Generation is temporarily unavailable. Please try again shortly.";
  }

  return "Generation failed. Please try again or use a different model.";
}

export function publicErrorPayload(err: unknown): {
  error: string;
  message: string;
} {
  const message = publicErrorMessage(err);
  return { error: "Generation failed", message };
}
