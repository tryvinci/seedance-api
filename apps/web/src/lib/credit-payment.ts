import { CREDIT_PACKS } from "@seedance/models";
import { addCredits, type Db } from "@seedance/db";
import { getDodoApiBase } from "@/lib/dodo";

export type DodoPayment = {
  payment_id?: string;
  status?: string | null;
  metadata?: Record<string, string> | null;
};

export function creditsFromMetadata(
  metadata: Record<string, string> | null | undefined,
): number | null {
  if (!metadata) return null;
  const creditsFromMeta = Number(metadata.credits);
  if (Number.isFinite(creditsFromMeta) && creditsFromMeta > 0) {
    return Math.round(creditsFromMeta);
  }
  const pack = CREDIT_PACKS.find((p) => p.id === metadata.pack_id);
  return pack?.credits ?? null;
}

export function isPaymentSucceeded(status: string | null | undefined): boolean {
  if (!status) return false;
  const s = status.toLowerCase();
  return s === "succeeded" || s === "success" || s === "paid";
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
  return (await res.json()) as DodoPayment;
}

/** Credit wallet for a succeeded payment. Idempotent on payment id. */
export async function creditSucceededPayment(
  db: Db,
  ownerId: string,
  payment: DodoPayment,
  paymentId: string,
): Promise<{ credited: boolean; credits: number }> {
  if (!isPaymentSucceeded(payment.status)) {
    return { credited: false, credits: 0 };
  }
  const metadata = payment.metadata ?? {};
  if (metadata.clerk_user_id && metadata.clerk_user_id !== ownerId) {
    throw new Error("Payment belongs to a different user");
  }
  const credits = creditsFromMetadata(metadata);
  if (!credits) {
    throw new Error("Payment missing credit metadata");
  }
  await addCredits(db, ownerId, credits, "purchase", paymentId);
  return { credited: true, credits };
}
