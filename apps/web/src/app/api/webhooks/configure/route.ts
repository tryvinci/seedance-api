import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { drizzle } from "drizzle-orm/d1";
import { upsertWebhookEndpoint } from "@seedance/db";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { url } = await req.json();
  if (!url || typeof url !== "string") {
    return NextResponse.json({ error: "url required" }, { status: 400 });
  }

  const secret = crypto.randomUUID();
  const { env } = await getCloudflareContext({ async: true });
  const db = drizzle(env.DB);
  await upsertWebhookEndpoint(db, userId, url, secret);

  return NextResponse.json({ ok: true, secret });
}
