-- ==========================================================================
-- PROCUREMENT PHASE 8 — Settings (per-org configuration)
-- Idempotent, additive, transactional. No drops. No renames.
-- ==========================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS "ProcurementSettings" (
  id                        TEXT PRIMARY KEY,
  "organizationId"          TEXT NOT NULL UNIQUE,
  "defaultCurrency"         TEXT DEFAULT 'KES',
  "defaultPaymentTerms"     INTEGER DEFAULT 30,
  "requireGRNBeforeInvoice" BOOLEAN DEFAULT FALSE,
  "requireQualityInspection" BOOLEAN DEFAULT FALSE,
  "matchQtyTolerance"       NUMERIC(10,4) DEFAULT 0.01,
  "matchAmountTolerancePct" NUMERIC(6,3)  DEFAULT 2.0,
  "matchAmountToleranceAbs" NUMERIC(18,2) DEFAULT 100,
  "autoApproveMatchedInvoices" BOOLEAN DEFAULT FALSE,
  "paymentRunRequireApproval"  BOOLEAN DEFAULT TRUE,
  "contractExpiryNoticeDays"   INTEGER DEFAULT 60,
  "poNumberPrefix"          TEXT DEFAULT 'PO',
  "grnNumberPrefix"         TEXT DEFAULT 'GRN',
  "invoiceNumberPrefix"     TEXT DEFAULT 'INV',
  notes                     TEXT,
  "createdAt"               TIMESTAMP DEFAULT NOW(),
  "updatedAt"               TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "ProcurementSettings_org_idx"
  ON "ProcurementSettings" ("organizationId");

-- Seed one row per org (idempotent)
INSERT INTO "ProcurementSettings"
  (id, "organizationId", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, o.id, NOW(), NOW()
FROM "Organization" o
WHERE NOT EXISTS (
  SELECT 1 FROM "ProcurementSettings" ps WHERE ps."organizationId" = o.id
);

COMMIT;

-- Verification
SELECT
  (SELECT COUNT(*) FROM information_schema.tables
   WHERE table_schema='public' AND table_name='ProcurementSettings') AS ps_table,
  (SELECT COUNT(*) FROM information_schema.columns
   WHERE table_schema='public' AND table_name='ProcurementSettings') AS ps_cols,
  (SELECT COUNT(*) FROM "ProcurementSettings") AS seeded,
  (SELECT COUNT(DISTINCT "organizationId") FROM "ProcurementSettings") AS orgs_covered;

-- Expected:
--   ps_table 1, ps_cols ~18
--   seeded = #orgs (2)
--   orgs_covered = 2