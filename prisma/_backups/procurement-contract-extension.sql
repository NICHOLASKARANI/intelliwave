-- ==========================================================================
-- PROCUREMENT PHASE 6 — Supplier Contracts
-- Idempotent, additive, safe to re-run. No drops. No renames.
-- Uses real ProcurementNumbering schema: id, organizationId, scope,
-- prefix, year, counter, createdAt, updatedAt.
-- ==========================================================================

BEGIN;

-- ##########################################################################
-- PART 1 — SupplierContract header
-- ##########################################################################
CREATE TABLE IF NOT EXISTS "SupplierContract" (
  id                  TEXT PRIMARY KEY,
  "organizationId"    TEXT NOT NULL,
  "contractNumber"    TEXT,
  title               TEXT,
  "supplierId"        TEXT,
  "supplierName"      TEXT,
  type                TEXT DEFAULT 'SERVICE',
  "startDate"         TIMESTAMP,
  "endDate"           TIMESTAMP,
  value               NUMERIC(18,2) DEFAULT 0,
  currency            TEXT DEFAULT 'KES',
  "paymentTerms"      INTEGER DEFAULT 30,
  status              TEXT DEFAULT 'DRAFT',
  "autoRenew"         BOOLEAN DEFAULT FALSE,
  "renewalNoticeDays" INTEGER DEFAULT 30,
  "signedAt"          TIMESTAMP,
  "signedBy"          TEXT,
  "signedByName"      TEXT,
  "contractFileUrl"   TEXT,
  "purchaseOrderId"   TEXT,
  notes               TEXT,
  "createdBy"         TEXT,
  "createdByName"     TEXT,
  "createdAt"         TIMESTAMP DEFAULT NOW(),
  "updatedAt"         TIMESTAMP DEFAULT NOW()
);

-- ##########################################################################
-- PART 2 — SupplierContractLine
-- ##########################################################################
CREATE TABLE IF NOT EXISTS "SupplierContractLine" (
  id                TEXT PRIMARY KEY,
  "organizationId"  TEXT NOT NULL,
  "contractId"      TEXT NOT NULL,
  "lineNumber"      INTEGER,
  description       TEXT,
  quantity          NUMERIC(18,3) DEFAULT 0,
  "unitPrice"       NUMERIC(18,2) DEFAULT 0,
  "taxRate"         NUMERIC(5,2)  DEFAULT 0,
  "lineTotal"       NUMERIC(18,2) DEFAULT 0,
  "unitOfMeasure"   TEXT DEFAULT 'UNIT',
  notes             TEXT,
  "createdAt"       TIMESTAMP DEFAULT NOW(),
  "updatedAt"       TIMESTAMP DEFAULT NOW()
);

-- ##########################################################################
-- PART 3 — SupplierContractMilestone
-- ##########################################################################
CREATE TABLE IF NOT EXISTS "SupplierContractMilestone" (
  id                TEXT PRIMARY KEY,
  "organizationId"  TEXT NOT NULL,
  "contractId"      TEXT NOT NULL,
  name              TEXT,
  "dueDate"         TIMESTAMP,
  amount            NUMERIC(18,2) DEFAULT 0,
  status            TEXT DEFAULT 'PENDING',
  notes             TEXT,
  "createdAt"       TIMESTAMP DEFAULT NOW(),
  "updatedAt"       TIMESTAMP DEFAULT NOW()
);

-- ##########################################################################
-- PART 4 — Indexes
-- ##########################################################################
CREATE INDEX IF NOT EXISTS "SupplierContract_org_status_idx"
  ON "SupplierContract" ("organizationId", status);
CREATE INDEX IF NOT EXISTS "SupplierContract_org_supplier_idx"
  ON "SupplierContract" ("organizationId", "supplierId");
CREATE INDEX IF NOT EXISTS "SupplierContract_org_endDate_idx"
  ON "SupplierContract" ("organizationId", "endDate");
CREATE INDEX IF NOT EXISTS "SupplierContract_org_contractNumber_idx"
  ON "SupplierContract" ("organizationId", "contractNumber");

CREATE INDEX IF NOT EXISTS "SupplierContractLine_org_contract_idx"
  ON "SupplierContractLine" ("organizationId", "contractId");

CREATE INDEX IF NOT EXISTS "SupplierContractMilestone_org_contract_idx"
  ON "SupplierContractMilestone" ("organizationId", "contractId");
CREATE INDEX IF NOT EXISTS "SupplierContractMilestone_org_due_idx"
  ON "SupplierContractMilestone" ("organizationId", "dueDate");

-- ##########################################################################
-- PART 5 — Seed ProcurementNumbering for scope='CTR' per org
-- ##########################################################################
INSERT INTO "ProcurementNumbering"
  (id, "organizationId", scope, prefix, year, counter, "createdAt", "updatedAt")
SELECT
  gen_random_uuid()::text,
  o.id,
  'CTR',
  'CTR',
  EXTRACT(YEAR FROM NOW())::int,
  0,
  NOW(),
  NOW()
FROM "Organization" o
WHERE NOT EXISTS (
  SELECT 1 FROM "ProcurementNumbering" pn
  WHERE pn."organizationId" = o.id
    AND pn.scope = 'CTR'
    AND pn.year = EXTRACT(YEAR FROM NOW())::int
);

COMMIT;

-- ##########################################################################
-- PART 6 — Verification
-- ##########################################################################
SELECT
  (SELECT COUNT(*) FROM information_schema.tables
   WHERE table_schema='public' AND table_name='SupplierContract') AS sc_table,
  (SELECT COUNT(*) FROM information_schema.columns
   WHERE table_schema='public' AND table_name='SupplierContract') AS sc_cols,
  (SELECT COUNT(*) FROM information_schema.tables
   WHERE table_schema='public' AND table_name='SupplierContractLine') AS scl_table,
  (SELECT COUNT(*) FROM information_schema.columns
   WHERE table_schema='public' AND table_name='SupplierContractLine') AS scl_cols,
  (SELECT COUNT(*) FROM information_schema.tables
   WHERE table_schema='public' AND table_name='SupplierContractMilestone') AS scm_table,
  (SELECT COUNT(*) FROM information_schema.columns
   WHERE table_schema='public' AND table_name='SupplierContractMilestone') AS scm_cols,
  (SELECT COUNT(*) FROM "ProcurementNumbering" WHERE scope='CTR') AS ctr_seeded;

-- Expected (approximate — extras from other sessions are okay):
--   sc_table 1, sc_cols ~24
--   scl_table 1, scl_cols ~13
--   scm_table 1, scm_cols ~10
--   ctr_seeded = #orgs (>= 1)