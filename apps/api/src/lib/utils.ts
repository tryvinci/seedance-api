import { drizzle } from "drizzle-orm/d1";
import type { Env } from "../env";

export function getDb(env: Env) {
  return drizzle(env.DB);
}

export async function checkIdempotency(
  cache: Env["CACHE"],
  key: string,
  ownerId: string,
): Promise<string | null> {
  const existing = await cache.get(`idempotency:${ownerId}:${key}`);
  return existing;
}

export async function setIdempotency(
  cache: Env["CACHE"],
  key: string,
  ownerId: string,
  generationId: string,
) {
  await cache.put(`idempotency:${ownerId}:${key}`, generationId, {
    expirationTtl: 86400,
  });
}

const UPLOAD_MAX_FILE_BYTES = 25 * 1024 * 1024;
const UPLOAD_MAX_PER_HOUR = 20;
const UPLOAD_MAX_BYTES_PER_HOUR = 100 * 1024 * 1024;

/** Per-user media upload quota (shared upstream credential protection). */
export async function checkUploadQuota(
  cache: Env["CACHE"],
  ownerId: string,
  fileBytes: number,
): Promise<{ ok: true } | { ok: false; error: string; status: 413 | 429 }> {
  if (fileBytes > UPLOAD_MAX_FILE_BYTES) {
    return {
      ok: false,
      status: 413,
      error: "File too large. Max 25MB; use a public URL for larger files.",
    };
  }

  const hour = Math.floor(Date.now() / 3_600_000);
  const countKey = `upload:count:${ownerId}:${hour}`;
  const bytesKey = `upload:bytes:${ownerId}:${hour}`;

  const [countRaw, bytesRaw] = await Promise.all([
    cache.get(countKey),
    cache.get(bytesKey),
  ]);
  const count = Number(countRaw ?? 0);
  const bytes = Number(bytesRaw ?? 0);

  if (count >= UPLOAD_MAX_PER_HOUR) {
    return {
      ok: false,
      status: 429,
      error: "Upload rate limit exceeded. Try again later.",
    };
  }
  if (bytes + fileBytes > UPLOAD_MAX_BYTES_PER_HOUR) {
    return {
      ok: false,
      status: 429,
      error: "Hourly upload quota exceeded. Try again later.",
    };
  }

  const ttl = 3600 + 60;
  await Promise.all([
    cache.put(countKey, String(count + 1), { expirationTtl: ttl }),
    cache.put(bytesKey, String(bytes + fileBytes), { expirationTtl: ttl }),
  ]);

  return { ok: true };
}

export async function copyToR2(
  bucket: Env["MEDIA"],
  sourceUrl: string,
  key: string,
): Promise<string> {
  const res = await fetch(sourceUrl);
  if (!res.ok) throw new Error(`Failed to fetch output: ${res.status}`);
  const contentType =
    res.headers.get("content-type") ?? "application/octet-stream";
  await bucket.put(key, res.body, {
    httpMetadata: { contentType },
  });
  return key;
}

export function publicMediaUrl(env: Env, r2Key: string): string {
  if (env.MEDIA_PUBLIC_URL) {
    return `${env.MEDIA_PUBLIC_URL}/${r2Key}`;
  }
  return `https://api.seedanceapi.us/v1/media/${r2Key}`;
}

export async function deliverWebhook(
  url: string,
  secret: string,
  payload: Record<string, unknown>,
) {
  const body = JSON.stringify(payload);
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(`${timestamp}.${body}`),
  );
  const signature = btoa(String.fromCharCode(...new Uint8Array(sig)));

  await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Seedance-Timestamp": timestamp,
      "X-Seedance-Signature": signature,
    },
    body,
  });
}
