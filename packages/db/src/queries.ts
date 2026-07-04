import { eq, desc, and } from "drizzle-orm";
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
  await db.insert(wallets).values({
    ownerId,
    creditBalance: 0,
    createdAt: ts,
    updatedAt: ts,
  });
  return db.select().from(wallets).where(eq(wallets.ownerId, ownerId)).get();
}

export async function getWalletBalance(db: Db, ownerId: string) {
  const wallet = await ensureWallet(db, ownerId);
  return wallet?.creditBalance ?? 0;
}

export async function addCredits(
  db: Db,
  ownerId: string,
  amount: number,
  reason: string,
  dodoPaymentId?: string,
) {
  // Idempotent on payment id so webhook retries do not double-credit.
  if (dodoPaymentId) {
    const existing = await db
      .select()
      .from(creditLedger)
      .where(eq(creditLedger.dodoPaymentId, dodoPaymentId))
      .get();
    if (existing) return existing.id;
  }

  await ensureWallet(db, ownerId);
  const ts = now();
  const ledgerId = crypto.randomUUID();
  await db.insert(creditLedger).values({
    id: ledgerId,
    ownerId,
    delta: amount,
    reason,
    dodoPaymentId: dodoPaymentId ?? null,
    status: "committed",
    createdAt: ts,
  });
  const wallet = await db
    .select()
    .from(wallets)
    .where(eq(wallets.ownerId, ownerId))
    .get();
  await db
    .update(wallets)
    .set({
      creditBalance: (wallet?.creditBalance ?? 0) + amount,
      updatedAt: ts,
    })
    .where(eq(wallets.ownerId, ownerId));
  return ledgerId;
}

export async function holdCredits(
  db: Db,
  ownerId: string,
  amount: number,
  generationId: string,
) {
  const wallet = await ensureWallet(db, ownerId);
  if ((wallet?.creditBalance ?? 0) < amount) {
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
  await db
    .update(wallets)
    .set({
      creditBalance: (wallet?.creditBalance ?? 0) - amount,
      updatedAt: ts,
    })
    .where(eq(wallets.ownerId, ownerId));
  return ledgerId;
}

export async function commitHold(
  db: Db,
  generationId: string,
) {
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
  amount: number,
) {
  const ts = now();
  await db
    .update(creditLedger)
    .set({ status: "refunded" })
    .where(
      and(
        eq(creditLedger.generationId, generationId),
        eq(creditLedger.status, "pending"),
      ),
    );
  const wallet = await db
    .select()
    .from(wallets)
    .where(eq(wallets.ownerId, ownerId))
    .get();
  await db
    .update(wallets)
    .set({
      creditBalance: (wallet?.creditBalance ?? 0) + amount,
      updatedAt: ts,
    })
    .where(eq(wallets.ownerId, ownerId));
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
  limit = 50,
) {
  return db
    .select()
    .from(generations)
    .where(eq(generations.ownerId, ownerId))
    .orderBy(desc(generations.createdAt))
    .limit(limit)
    .all();
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

export * from "./schema";
