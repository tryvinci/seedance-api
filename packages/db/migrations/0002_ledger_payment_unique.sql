-- One ledger row per Dodo payment (idempotent purchases).
CREATE UNIQUE INDEX IF NOT EXISTS idx_credit_ledger_dodo_payment
  ON credit_ledger(dodo_payment_id)
  WHERE dodo_payment_id IS NOT NULL;
