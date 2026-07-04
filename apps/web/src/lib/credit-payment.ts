import { CREDIT_PACKS, usdToCredits } from "@seedance/models";
import { addCredits, type Db } from "@seedance/db";
import { getDodoApiBase } from "@/lib/dodo";

export type DodoPayment = {
  payment_id?: string;
  paymentId?: string;
  id?: string;
  status?: string | null;
  total_amount?: number | null;
  settlement_amount?: number | null;
  metadata?: Record<string, string> | null;
};

export function paymentIdOf(payment: DodoPayment, fallback?: string): string {
  return (
    payment.payment_id ||
    payment.paymentId ||
    payment.id ||
    fallback ||
    ""
  );
}

export function creditsFromPayment(payment: DodoPayment): number | null {
  const metadata = payment.metadata ?? {};
  const creditsFromMeta = Number(metadata.credits);
  if (Number.isFinite(creditsFromMeta) && creditsFromMeta > 0) {
    return Math.round(creditsFromMeta);
  }

  const amountUsdMeta = Number(metadata.amount_usd);
  if (Number.isFinite(amountUsdMeta) && amountUsdMeta > 0) {
    return usdToCredits(amountUsdMeta);
  }

  const pack = CREDIT_PACKS.find((p) => p.id === metadata.pack_id);
  if (pack) return pack.credits;

  // Dodo amounts are in the smallest currency unit (cents for USD).
  const cents = Number(payment.total_amount ?? payment.settlement_amount);
  if (Number.isFinite(cents) && cents > 0) {
    return Math.round(cents);
  }

  return null;
}

export function isPaymentSucceeded(status: string | null | undefined): boolean {
  if (!status) return false;
  const s = status.toLowerCase();
  return (
    s === "succeeded" ||
    s === "success" ||
    s === "paid" ||
    s === "complete" ||
    s === "completed"
  );
}

export async function fetchDodoPayment(
  paymentId: string,
): Promise<DodoPayment | null> {
  const key = process.env.DODO_PAYMENTS_API_KEY?.trim();
  if (!key) return null;
  const res = await fetch(`${getDodoApiBase()}/payments/${paymentId}`, {
    headers: { Authorization: `Bearer ${key}` },
  });
  if (!res.ok) {
    console.error("Dodo payment fetch failed:", res.status, await res.text());
    return null;
  }
  const data = (await res.json()) as DodoPayment;
  // Ensure id is present for callers.
  if (!data.payment_id && !data.id) {
    data.payment_id = paymentId;
  }
  return data;
}

/** Credit wallet for a succeeded payment. Idempotent on payment id. */
export async function creditSucceededPayment(
  db: Db,
  ownerId: string,
  payment: DodoPayment,
  paymentId: string,
): Promise<{ credited: boolean; credits: number }> {
  // Webhook events are already payment.succeeded; GET may omit status.
  const statusOk =
    !payment.status || isPaymentSucceeded(payment.status);
  if (!statusOk) {
    console.error("Payment not succeeded:", paymentId, payment.status);
    return { credited: false, credits: 0 };
  }

  const metadata = payment.metadata ?? {};
  const paymentOwner = metadata.clerk_user_id?.trim();
  // Never credit the caller when ownership metadata is missing — that enables
  // balance theft via a leaked payment_id.
  if (!paymentOwner) {
    throw new Error("Payment missing owner metadata");
  }
  if (paymentOwner !== ownerId) {
    throw new Error("Payment belongs to a different user");
  }

  const credits = creditsFromPayment(payment);
  if (!credits) {
    console.error("Payment missing credit amount:", paymentId, payment);
    throw new Error("Payment missing credit metadata");
  }

  const id = paymentIdOf(payment, paymentId);
  // Always credit the payment owner from metadata (matches ownerId after checks).
  await addCredits(db, paymentOwner, credits, "purchase", id);
  return { credited: true, credits };
}
