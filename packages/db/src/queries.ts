import { eq, desc, and, sql, inArray, gte } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import {
  wallets,
  creditLedger,
  generations,
  webhookEndpoints,
  type Generation,
} from "./schema";

export type Db = DrizzleD1Database;

function now() {
  return new Date().toISOString();
}

export async function ensureWallet(db: Db, ownerId: string) {
  const existing = await db
    .select()
    .from(wallets)
    .where(eq(wallets.ownerId, ownerId))
    .get();
  if (existing) return existing;
  const ts = now();
  try {
    await db.insert(wallets).values({
      ownerId,
      creditBalance: 0,
      createdAt: ts,
      updatedAt: ts,
    });
  } catch {
    // Concurrent insert — fall through to select.
  }
  return db.select().from(wallets).where(eq(wallets.ownerId, ownerId)).get();
}

/**
 * Balance from committed + pending ledger rows (pending holds already deducted).
 * Refunded rows are excluded (wallet was credited back separately).
 */
export async function sumLedgerBalance(db: Db, ownerId: string): Promise<number> {
  const row = await db
    .select({
      total: sql<number>`coalesce(sum(${creditLedger.delta}), 0)`,
    })
    .from(creditLedger)
    .where(
      and(
        eq(creditLedger.ownerId, ownerId),
        inArray(creditLedger.status, ["committed", "pending"]),
      ),
    )
    .get();
  return Number(row?.total ?? 0);
}

/** Force wallet.credit_balance to match the ledger (source of truth). */
export async function reconcileWalletBalance(
  db: Db,
  ownerId: string,
): Promise<number> {
  await ensureWallet(db, ownerId);
  const balance = await sumLedgerBalance(db, ownerId);
  const ts = now();
  await db
    .update(wallets)
    .set({ creditBalance: balance, updatedAt: ts })
    .where(eq(wallets.ownerId, ownerId));
  return balance;
}

export async function getWalletBalance(db: Db, ownerId: string) {
  // Always derive from ledger so a missed wallet update cannot zero out funds.
  return reconcileWalletBalance(db, ownerId);
}

export async function addCredits(
  db: Db,
  ownerId: string,
  amount: number,
  reason: string,
  dodoPaymentId?: string,
) {
  if (!Number.isFinite(amount) || amount === 0) {
    return reconcileWalletBalance(db, ownerId);
  }

  // Idempotent on payment id so webhook + confirm do not double-credit.
  if (dodoPaymentId) {
    const existing = await db
      .select()
      .from(creditLedger)
      .where(eq(creditLedger.dodoPaymentId, dodoPaymentId))
      .get();
    if (existing) {
      // Still reconcile in case a prior write inserted ledger but missed wallet.
      await reconcileWalletBalance(db, ownerId);
      return existing.id;
    }
  }

  await ensureWallet(db, ownerId);
  const ts = now();
  const ledgerId = crypto.randomUUID();

  try {
    await db.insert(creditLedger).values({
      id: ledgerId,
      ownerId,
      delta: amount,
      reason,
      dodoPaymentId: dodoPaymentId ?? null,
      status: "committed",
      createdAt: ts,
    });
  } catch (err) {
    // Unique payment id race — treat as already credited.
    if (dodoPaymentId) {
      const existing = await db
        .select()
        .from(creditLedger)
        .where(eq(creditLedger.dodoPaymentId, dodoPaymentId))
        .get();
      if (existing) {
        await reconcileWalletBalance(db, ownerId);
        return existing.id;
      }
    }
    throw err;
  }

  await reconcileWalletBalance(db, ownerId);
  return ledgerId;
}

export async function holdCredits(
  db: Db,
  ownerId: string,
  amount: number,
  generationId: string,
) {
  const balance = await reconcileWalletBalance(db, ownerId);
  if (balance < amount) {
    throw new Error("INSUFFICIENT_CREDITS");
  }
  const ts = now();
  const ledgerId = crypto.randomUUID();
  await db.insert(creditLedger).values({
    id: ledgerId,
    ownerId,
    delta: -amount,
    reason: "generation_hold",
    generationId,
    status: "pending",
    createdAt: ts,
  });
  await reconcileWalletBalance(db, ownerId);
  return ledgerId;
}

export async function commitHold(db: Db, generationId: string) {
  await db
    .update(creditLedger)
    .set({ status: "committed" })
    .where(
      and(
        eq(creditLedger.generationId, generationId),
        eq(creditLedger.status, "pending"),
      ),
    );
}

export async function refundHold(
  db: Db,
  ownerId: string,
  generationId: string,
  _amount: number,
) {
  await db
    .update(creditLedger)
    .set({ status: "refunded" })
    .where(
      and(
        eq(creditLedger.generationId, generationId),
        eq(creditLedger.status, "pending"),
      ),
    );
  await reconcileWalletBalance(db, ownerId);
}

export async function createGeneration(
  db: Db,
  data: {
    id: string;
    ownerId: string;
    kind: string;
    canonicalModel: string;
    paramsJson: string;
    creditsCost: number;
    providerCostCredits?: number | null;
    providerModelPath?: string | null;
    provider?: string;
    providerTaskId?: string;
    status?: string;
  },
) {
  const ts = now();
  await db.insert(generations).values({
    id: data.id,
    ownerId: data.ownerId,
    kind: data.kind,
    canonicalModel: data.canonicalModel,
    provider: data.provider ?? null,
    providerTaskId: data.providerTaskId ?? null,
    status: data.status ?? "pending",
    paramsJson: data.paramsJson,
    creditsCost: data.creditsCost,
    providerCostCredits: data.providerCostCredits ?? null,
    providerModelPath: data.providerModelPath ?? null,
    createdAt: ts,
    updatedAt: ts,
  });
}

export async function updateGeneration(
  db: Db,
  id: string,
  data: Partial<{
    status: string;
    provider: string;
    providerTaskId: string;
    providerCostCredits: number | null;
    providerModelPath: string | null;
    outputR2Key: string;
    outputUrl: string;
    error: string;
  }>,
) {
  await db
    .update(generations)
    .set({ ...data, updatedAt: now() })
    .where(eq(generations.id, id));
}

export async function getGeneration(
  db: Db,
  id: string,
  ownerId?: string,
): Promise<Generation | undefined> {
  const conditions = ownerId
    ? and(eq(generations.id, id), eq(generations.ownerId, ownerId))
    : eq(generations.id, id);
  return db.select().from(generations).where(conditions).get();
}

export async function listGenerations(
  db: Db,
  ownerId: string,
  opts?: { limit?: number; offset?: number; since?: string },
) {
  const limit = opts?.limit ?? 50;
  const offset = opts?.offset ?? 0;
  const conditions = [eq(generations.ownerId, ownerId)];
  if (opts?.since) {
    conditions.push(gte(generations.createdAt, opts.since));
  }
  return db
    .select()
    .from(generations)
    .where(and(...conditions))
    .orderBy(desc(generations.createdAt))
    .limit(limit)
    .offset(offset)
    .all();
}

export async function countGenerations(
  db: Db,
  ownerId: string,
  since?: string,
): Promise<number> {
  const conditions = [eq(generations.ownerId, ownerId)];
  if (since) {
    conditions.push(gte(generations.createdAt, since));
  }
  const row = await db
    .select({ n: sql<number>`count(*)` })
    .from(generations)
    .where(and(...conditions))
    .get();
  return Number(row?.n ?? 0);
}

export async function upsertWebhookEndpoint(
  db: Db,
  ownerId: string,
  url: string,
  secret: string,
) {
  const ts = now();
  const existing = await db
    .select()
    .from(webhookEndpoints)
    .where(eq(webhookEndpoints.ownerId, ownerId))
    .get();
  if (existing) {
    await db
      .update(webhookEndpoints)
      .set({ url, secret, updatedAt: ts })
      .where(eq(webhookEndpoints.ownerId, ownerId));
  } else {
    await db.insert(webhookEndpoints).values({
      ownerId,
      url,
      secret,
      createdAt: ts,
      updatedAt: ts,
    });
  }
}

export async function getWebhookEndpoint(db: Db, ownerId: string) {
  return db
    .select()
    .from(webhookEndpoints)
    .where(eq(webhookEndpoints.ownerId, ownerId))
    .get();
}
