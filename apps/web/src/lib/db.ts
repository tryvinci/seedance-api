import { drizzle } from "drizzle-orm/d1";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { Db } from "@seedance/db";

/** Per-request D1 client (OpenNext / Workers). */
export async function getDb(): Promise<Db> {
  const { env } = await getCloudflareContext({ async: true });
  if (!env.DB) {
    throw new Error("D1 binding DB is missing");
  }
  return drizzle(env.DB);
}
