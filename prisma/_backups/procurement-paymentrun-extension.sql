-- ==========================================================================
-- PROCUREMENT PHASE 7 — Payment Runs + Spend Snapshots
-- Idempotent, additive, transactional. No drops. No renames.
-- Uses real ProcurementNumbering schema: id, organizationId, scope,
-- prefix, year, counter, createdAt, updatedAt.
-- ==========================================================================

BEGIN;

-- ##########################################################################
-- PART 1 — PaymentRun header
-- ##########################################################################
CREATE TABLE IF NOT EXISTS "PaymentRun" (
  id                TEXT PRIMARY KEY,
  "organizationId"  TEXT NOT NULL,
  "runNumber"       TEXT,
  "paymentDate"     TIMESTAMP,
  "cutoffDate"      TIMESTAMP,
  currency          TEXT DEFAULT 'KES',
  "totalAmount"     NUMERIC(18,2) DEFAULT 0,
  "invoiceCount"    INTEGER DEFAULT 0,
  status            TEXT DEFAULT 'DRAFT',
  method            TEXT DEFAULT 'BANK_TRANSFER',
  "bankFileUrl"     TEXT,
  "bankAccountId"   TEXT,
  "approvedAt"      TIMESTAMP,
  "approvedBy"      TEXT,
  "approvedByName"  TEXT,
  "executedAt"      TIMESTAMP,
  "failureReason"   TEXT,
  notes             TEXT,
  "createdBy"       TEXT,
  "createdByName"   TEXT,
  "createdAt"       TIMESTAMP DEFAULT NOW(),
  "updatedAt"       TIMESTAMP DEFAULT NOW()
);

-- ##########################################################################
-- PART 2 — PaymentRunLine (one per invoice)
-- ##########################################################################
CREATE TABLE IF NOT EXISTS "PaymentRunLine" (
  id                    TEXT PRIMARY KEY,
  "organizationId"      TEXT NOT NULL,
  "paymentRunId"        TEXT NOT NULL,
  "supplierInvoiceId"   TEXT,
  "supplierId"          TEXT,
  "supplierName"        TEXT,
  "invoiceNumber"       TEXT,
  amount                NUMERIC(18,2) DEFAULT 0,
  currency              TEXT DEFAULT 'KES',
  "paymentReference"    TEXT,
  status                TEXT DEFAULT 'PENDING',
  "paidAt"              TIMESTAMP,
  "failureReason"       TEXT,
  "createdAt"           TIMESTAMP DEFAULT NOW(),
  "updatedAt"           TIMESTAMP DEFAULT NOW()
);

-- ##########################################################################
-- PART 3 — SpendSnapshot (materialized aggregates)
-- ##########################################################################
CREATE TABLE IF NOT EXISTS "SpendSnapshot" (
  id                TEXT PRIMARY KEY,
  "organizationId"  TEXT NOT NULL,
  "periodStart"     TIMESTAMP,
  "periodEnd"       TIMESTAMP,
  "periodType"      TEXT DEFAULT 'MONTH',
  dimension         TEXT DEFAULT 'ALL',
  "dimensionId"     TEXT,
  "dimensionLabel"  TEXT,
  "totalSpend"      NUMERIC(18,2) DEFAULT 0,
  "invoiceCount"    INTEGER DEFAULT 0,
  "poCount"         INTEGER DEFAULT 0,
  currency          TEXT DEFAULT 'KES',
  "createdAt"       TIMESTAMP DEFAULT NOW(),
  "updatedAt"       TIMESTAMP DEFAULT NOW()
);

-- ##########################################################################
-- PART 4 — Indexes
-- ##########################################################################
CREATE INDEX IF NOT EXISTS "PaymentRun_org_status_idx"
  ON "PaymentRun" ("organizationId", status);
CREATE INDEX IF NOT EXISTS "PaymentRun_org_paymentDate_idx"
  ON "PaymentRun" ("organizationId", "paymentDate");
CREATE INDEX IF NOT EXISTS "PaymentRun_org_runNumber_idx"
  ON "PaymentRun" ("organizationId", "runNumber");

CREATE INDEX IF NOT EXISTS "PaymentRunLine_org_run_idx"
  ON "PaymentRunLine" ("organizationId", "paymentRunId");
CREATE INDEX IF NOT EXISTS "PaymentRunLine_org_invoice_idx"
  ON "PaymentRunLine" ("organizationId", "supplierInvoiceId");
CREATE INDEX IF NOT EXISTS "PaymentRunLine_org_supplier_idx"
  ON "PaymentRunLine" ("organizationId", "supplierId");

CREATE INDEX IF NOT EXISTS "SpendSnapshot_org_period_idx"
  ON "SpendSnapshot" ("organizationId", "periodType", "periodStart");
CREATE INDEX IF NOT EXISTS "SpendSnapshot_org_dimension_idx"
  ON "SpendSnapshot" ("organizationId", dimension, "dimensionId");

-- ##########################################################################
-- PART 5 — Seed ProcurementNumbering for scope='PRUN' per org
-- ##########################################################################
INSERT INTO "ProcurementNumbering"
  (id, "organizationId", scope, prefix, year, counter, "createdAt", "updatedAt")
SELECT
  gen_random_uuid()::text,
  o.id,
  'PRUN',
  'PRUN',
  EXTRACT(YEAR FROM NOW())::int,
  0,
  NOW(),
  NOW()
FROM "Organization" o
WHERE NOT EXISTS (
  SELECT 1 FROM "ProcurementNumbering" pn
  WHERE pn."organizationId" = o.id
    AND pn.scope = 'PRUN'
    AND pn.year = EXTRACT(YEAR FROM NOW())::int
);

COMMIT;

-- ##########################################################################
-- PART 6 — Verification
-- ##########################################################################
SELECT
  (SELECT COUNT(*) FROM information_schema.tables
   WHERE table_schema='public' AND table_name='PaymentRun') AS pr_table,
  (SELECT COUNT(*) FROM information_schema.columns
   WHERE table_schema='public' AND table_name='PaymentRun') AS pr_cols,
  (SELECT COUNT(*) FROM information_schema.tables
   WHERE table_schema='public' AND table_name='PaymentRunLine') AS prl_table,
  (SELECT COUNT(*) FROM information_schema.columns
   WHERE table_schema='public' AND table_name='PaymentRunLine') AS prl_cols,
  (SELECT COUNT(*) FROM information_schema.tables
   WHERE table_schema='public' AND table_name='SpendSnapshot') AS ss_table,
  (SELECT COUNT(*) FROM information_schema.columns
   WHERE table_schema='public' AND table_name='SpendSnapshot') AS ss_cols,
  (SELECT COUNT(*) FROM "ProcurementNumbering" WHERE scope='PRUN') AS prun_seeded;

-- Expected:
--   pr_table 1,  pr_cols ~24
--   prl_table 1, prl_cols ~15
--   ss_table 1,  ss_cols ~14
--   prun_seeded >= 1