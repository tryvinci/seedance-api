import { Webhook } from "svix";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { ensureWallet } from "@seedance/db";
import { isDevWebhookBypass } from "@/lib/webhook-dev";
import { ensureDefaultApiKey } from "@/lib/ensure-default-api-key";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const payload = await req.text();
  const secret = process.env.CLERK_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  const devBypass = isDevWebhookBypass(secret, "clerk");
  let event: { type: string; data: { id: string } };

  if (devBypass) {
    try {
      event = JSON.parse(payload) as typeof event;
    } catch {
      return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
    }
  } else {
    const headerPayload = await headers();
    const svixId = headerPayload.get("svix-id");
    const svixTimestamp = headerPayload.get("svix-timestamp");
    const svixSignature = headerPayload.get("svix-signature");

    if (!svixId || !svixTimestamp || !svixSignature) {
      return NextResponse.json({ error: "Missing svix headers" }, { status: 400 });
    }

    const wh = new Webhook(secret);
    try {
      event = wh.verify(payload, {
        "svix-id": svixId,
        "svix-timestamp": svixTimestamp,
        "svix-signature": svixSignature,
      }) as typeof event;
    } catch {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
  }

  if (event.type === "user.created") {
    const userId = event.data.id;
    try {
      const db = await getDb();
      await ensureWallet(db, userId);
    } catch (err) {
      console.error("Failed to provision wallet:", err);
    }
    try {
      await ensureDefaultApiKey(userId);
    } catch (err) {
      console.error("Failed to provision default API key:", err);
    }
  }

  return NextResponse.json({ received: true });
}
