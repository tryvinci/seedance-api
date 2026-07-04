/** Publishable key from build-time or runtime (CF secret may be unprefixed). */
export function getClerkPublishableKey(): string | undefined {
  return (
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim() ||
    process.env.CLERK_PUBLISHABLE_KEY?.trim() ||
    undefined
  );
}
