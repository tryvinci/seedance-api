CREATE TABLE IF NOT EXISTS wallets (
  owner_id TEXT PRIMARY KEY,
  credit_balance INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS credit_ledger (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL,
  delta INTEGER NOT NULL,
  reason TEXT NOT NULL,
  generation_id TEXT,
  dodo_payment_id TEXT,
  status TEXT NOT NULL DEFAULT 'committed',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS generations (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL,
  kind TEXT NOT NULL,
  canonical_model TEXT NOT NULL,
  provider TEXT,
  provider_task_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  params_json TEXT NOT NULL,
  output_r2_key TEXT,
  output_url TEXT,
  credits_cost INTEGER NOT NULL,
  error TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS webhook_endpoints (
  owner_id TEXT PRIMARY KEY,
  url TEXT NOT NULL,
  secret TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_generations_owner ON generations(owner_id);
CREATE INDEX IF NOT EXISTS idx_credit_ledger_owner ON credit_ledger(owner_id);
CREATE INDEX IF NOT EXISTS idx_credit_ledger_generation ON credit_ledger(generation_id);
