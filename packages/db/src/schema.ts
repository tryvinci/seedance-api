import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const wallets = sqliteTable("wallets", {
  ownerId: text("owner_id").primaryKey(),
  creditBalance: integer("credit_balance").notNull().default(0),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const creditLedger = sqliteTable("credit_ledger", {
  id: text("id").primaryKey(),
  ownerId: text("owner_id").notNull(),
  delta: integer("delta").notNull(),
  reason: text("reason").notNull(),
  generationId: text("generation_id"),
  dodoPaymentId: text("dodo_payment_id"),
  status: text("status").notNull().default("committed"),
  createdAt: text("created_at").notNull(),
});

export const generations = sqliteTable("generations", {
  id: text("id").primaryKey(),
  ownerId: text("owner_id").notNull(),
  kind: text("kind").notNull(),
  canonicalModel: text("canonical_model").notNull(),
  provider: text("provider"),
  providerTaskId: text("provider_task_id"),
  status: text("status").notNull().default("pending"),
  paramsJson: text("params_json").notNull(),
  outputR2Key: text("output_r2_key"),
  outputUrl: text("output_url"),
  creditsCost: integer("credits_cost").notNull(),
  /** Upstream provider cost in credits (1 credit = $0.01). From WaveSpeed pricing/billing API. */
  providerCostCredits: integer("provider_cost_credits"),
  /** WaveSpeed model path used for pricing/submit. */
  providerModelPath: text("provider_model_path"),
  error: text("error"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const webhookEndpoints = sqliteTable("webhook_endpoints", {
  ownerId: text("owner_id").primaryKey(),
  url: text("url").notNull(),
  secret: text("secret").notNull(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export type Wallet = typeof wallets.$inferSelect;
export type Generation = typeof generations.$inferSelect;
export type CreditLedgerEntry = typeof creditLedger.$inferSelect;
export type WebhookEndpoint = typeof webhookEndpoints.$inferSelect;
