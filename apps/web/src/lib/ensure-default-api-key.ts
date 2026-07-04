import { clerkClient } from "@clerk/nextjs/server";

export const DEFAULT_API_KEY_NAME = "Default";

type PrivateMeta = {
  defaultApiKeySecret?: string;
  defaultApiKeyId?: string;
};

/** e.g. "API key · Jul 3, 2026, 9:13 PM" */
export function autoApiKeyName(date = new Date()): string {
  const label = date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
  return `API key · ${label}`;
}

export async function createUserApiKey(
  userId: string,
  name?: string,
): Promise<{ secret: string | null; keyId: string; name: string }> {
  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const meta = (user.privateMetadata ?? {}) as PrivateMeta;
  const keyName = (name?.trim() || autoApiKeyName()).slice(0, 80);

  const apiKey = await client.apiKeys.create({
    name: keyName,
    subject: userId,
    description: "Created from SeedanceAPI dashboard",
    createdBy: userId,
  });

  const secret =
    typeof apiKey.secret === "string" && apiKey.secret.length > 0
      ? apiKey.secret
      : null;

  await client.users.updateUserMetadata(userId, {
    privateMetadata: {
      ...meta,
      defaultApiKeySecret: secret,
      defaultApiKeyId: apiKey.id,
    },
  });

  return { secret, keyId: apiKey.id, name: apiKey.name };
}

/**
 * Ensures the user has a Default API key and returns its secret when available.
 * Secrets are only returned at creation time (or from privateMetadata we store then).
 */
export async function ensureDefaultApiKey(userId: string): Promise<{
  created: boolean;
  secret: string | null;
  keyId: string | null;
  name: string | null;
}> {
  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const meta = (user.privateMetadata ?? {}) as PrivateMeta;

  const existing = await client.apiKeys.list({
    subject: userId,
    limit: 20,
  });

  const storedStillValid =
    Boolean(meta.defaultApiKeySecret) &&
    Boolean(meta.defaultApiKeyId) &&
    existing.data.some((k) => k.id === meta.defaultApiKeyId);

  if (storedStillValid) {
    const key = existing.data.find((k) => k.id === meta.defaultApiKeyId)!;
    return {
      created: false,
      secret: meta.defaultApiKeySecret!,
      keyId: key.id,
      name: key.name,
    };
  }

  const namedDefault = existing.data.find(
    (k) => k.name === DEFAULT_API_KEY_NAME,
  );

  // Default exists but secret was never stored / was lost — cannot recover.
  if (namedDefault) {
    return {
      created: false,
      secret: null,
      keyId: namedDefault.id,
      name: namedDefault.name,
    };
  }

  // No Default key (zero keys, or only custom-named keys) — create one.
  const apiKey = await client.apiKeys.create({
    name: DEFAULT_API_KEY_NAME,
    subject: userId,
    description: "Created automatically for your account",
    createdBy: userId,
  });

  const secret =
    typeof apiKey.secret === "string" && apiKey.secret.length > 0
      ? apiKey.secret
      : null;

  await client.users.updateUserMetadata(userId, {
    privateMetadata: {
      ...meta,
      defaultApiKeySecret: secret,
      defaultApiKeyId: apiKey.id,
    },
  });

  return {
    created: true,
    secret,
    keyId: apiKey.id,
    name: apiKey.name,
  };
}
