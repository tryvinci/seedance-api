import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getWalletBalance } from "@seedance/db";
import { creditsToUsd } from "@seedance/models";
import {
  creditSucceededPayment,
  fetchDodoPayment,
} from "@/lib/credit-payment";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

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
    const db = await getDb();
    // Requires payment.metadata.clerk_user_id === session user (no fallback).
    const result = await creditSucceededPayment(db, userId, payment, paymentId);
    const balance = await getWalletBalance(db, userId);
    return NextResponse.json({
      credited: result.credited,
      credits: result.credits,
      balance_usd: creditsToUsd(balance),
      balance_credits: balance,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Credit failed";
    console.error("Payment confirm failed:", err);
    if (
      message.includes("different user") ||
      message.includes("missing owner")
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
