import { NextResponse } from "next/server";
import { verifyDodoWebhook } from "@/lib/dodo";
import { isDevWebhookBypass } from "@/lib/webhook-dev";
import {
  creditSucceededPayment,
  paymentIdOf,
  type DodoPayment,
} from "@/lib/credit-payment";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const payload = await req.text();
  const secret =
    process.env.DODO_WEBHOOK_SECRET ?? process.env.DODO_PAYMENTS_WEBHOOK_KEY;
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

  let event: {
    type: string;
    data?: DodoPayment & {
      payment_id?: string;
      id?: string;
    };
  };
  try {
    event = JSON.parse(payload);
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  // payment.succeeded is the source of truth for one-time top-ups.
  if (event.type === "payment.succeeded") {
    const paymentId = paymentIdOf(event.data ?? {}, event.data?.id);
    const metadata = event.data?.metadata ?? {};
    const userId = metadata.clerk_user_id;
    if (!userId || !paymentId) {
      console.error("Dodo webhook missing metadata:", {
        type: event.type,
        paymentId,
        metadata,
      });
      return NextResponse.json({ error: "Missing metadata" }, { status: 400 });
    }

    try {
      const db = await getDb();
      await creditSucceededPayment(
        db,
        userId,
        { ...event.data, status: event.data?.status ?? "succeeded" },
        paymentId,
      );
    } catch (err) {
      console.error("Failed to credit wallet:", err);
      return NextResponse.json({ error: "Credit failed" }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
