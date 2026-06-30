import { NextResponse } from "next/server";
import { drizzle } from "drizzle-orm/d1";
import { addCredits } from "@seedance/db";
import { CREDIT_PACKS } from "@seedance/models";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { isDevWebhookBypass } from "@/lib/webhook-dev";

async function verifyDodoWebhook(
  payload: string,
  headers: Headers,
  secret: string,
): Promise<boolean> {
  const msgId = headers.get("webhook-id");
  const timestamp = headers.get("webhook-timestamp");
  const signature = headers.get("webhook-signature");
  if (!msgId || !timestamp || !signature) return false;

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const toSign = `${msgId}.${timestamp}.${payload}`;
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(toSign));
  const expected = btoa(String.fromCharCode(...new Uint8Array(sig)));

  const signatures = signature.split(" ");
  return signatures.some((s) => {
    const parts = s.split(",");
    return parts.length === 2 && parts[1] === expected;
  });
}

export async function POST(req: Request) {
  const payload = await req.text();
  const secret = process.env.DODO_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  const devBypass = isDevWebhookBypass(secret, "dodo");
  if (!devBypass) {
    const valid = await verifyDodoWebhook(payload, req.headers, secret);
    if (!valid) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
  }

  const event = JSON.parse(payload) as {
    type: string;
    data?: {
      metadata?: Record<string, string>;
      payment_id?: string;
      id?: string;
    };
  };

  if (
    event.type === "payment.succeeded" ||
    event.type === "checkout.completed"
  ) {
    const metadata = event.data?.metadata ?? {};
    const userId = metadata.clerk_user_id;
    const packId = metadata.pack_id;
    const paymentId = event.data?.payment_id ?? event.data?.id;

    if (!userId || !packId) {
      return NextResponse.json({ error: "Missing metadata" }, { status: 400 });
    }

    const pack = CREDIT_PACKS.find((p) => p.id === packId);
    if (!pack) {
      return NextResponse.json({ error: "Invalid pack" }, { status: 400 });
    }

    try {
      const { env } = await getCloudflareContext({ async: true });
      const db = drizzle(env.DB);
      await addCredits(db, userId, pack.credits, "purchase", paymentId);
    } catch (err) {
      console.error("Failed to credit wallet:", err);
      return NextResponse.json({ error: "Credit failed" }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
