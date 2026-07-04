import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { drizzle } from "drizzle-orm/d1";
import { getWalletBalance } from "@seedance/db";
import { creditsToUsd } from "@seedance/models";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import {
  creditSucceededPayment,
  fetchDodoPayment,
} from "@/lib/credit-payment";

/**
 * Reconcile a payment after return from Dodo checkout.
 * Safe if the webhook already credited (idempotent on payment id).
 */
export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const paymentId =
    typeof body.paymentId === "string"
      ? body.paymentId.trim()
      : typeof body.payment_id === "string"
        ? body.payment_id.trim()
        : "";
  if (!paymentId) {
    return NextResponse.json({ error: "paymentId required" }, { status: 400 });
  }

  const payment = await fetchDodoPayment(paymentId);
  if (!payment) {
    return NextResponse.json(
      { error: "Payment not found" },
      { status: 404 },
    );
  }

  try {
    const { env } = await getCloudflareContext({ async: true });
    const db = drizzle(env.DB);
    const result = await creditSucceededPayment(
      db,
      userId,
      payment,
      paymentId,
    );
    const balance = await getWalletBalance(db, userId);
    return NextResponse.json({
      credited: result.credited,
      credits: result.credits,
      balance_usd: creditsToUsd(balance),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Credit failed";
    console.error("Payment confirm failed:", err);
    if (message.includes("different user")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
