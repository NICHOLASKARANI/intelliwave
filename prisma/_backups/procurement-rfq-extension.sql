-- ==========================================================================
-- PROCUREMENT PHASE 6 — RFQ Extension + Lines + Invites + SupplierQuoteExt
-- Idempotent, additive, transactional. No drops. No renames.
-- Uses real ProcurementNumbering schema: id, organizationId, scope,
-- prefix, year, counter, createdAt, updatedAt.
-- ==========================================================================

BEGIN;

-- ##########################################################################
-- PART 1 — Extend existing RFQ
-- ##########################################################################
ALTER TABLE "RFQ" ADD COLUMN IF NOT EXISTS "rfqNumber"       TEXT;
ALTER TABLE "RFQ" ADD COLUMN IF NOT EXISTS description       TEXT;
ALTER TABLE "RFQ" ADD COLUMN IF NOT EXISTS type              TEXT DEFAULT 'RFQ';
ALTER TABLE "RFQ" ADD COLUMN IF NOT EXISTS category          TEXT;
ALTER TABLE "RFQ" ADD COLUMN IF NOT EXISTS currency          TEXT DEFAULT 'KES';
ALTER TABLE "RFQ" ADD COLUMN IF NOT EXISTS "requisitionId"   TEXT;
ALTER TABLE "RFQ" ADD COLUMN IF NOT EXISTS "purchaseOrderId" TEXT;
ALTER TABLE "RFQ" ADD COLUMN IF NOT EXISTS "issueDate"       TIMESTAMP;
ALTER TABLE "RFQ" ADD COLUMN IF NOT EXISTS "closingDate"     TIMESTAMP;
ALTER TABLE "RFQ" ADD COLUMN IF NOT EXISTS "deliveryDate"    TIMESTAMP;
ALTER TABLE "RFQ" ADD COLUMN IF NOT EXISTS "deliveryLocation" TEXT;
ALTER TABLE "RFQ" ADD COLUMN IF NOT EXISTS "paymentTerms"    TEXT;
ALTER TABLE "RFQ" ADD COLUMN IF NOT EXISTS "evaluationCriteria" JSONB;
ALTER TABLE "RFQ" ADD COLUMN IF NOT EXISTS "createdBy"       TEXT;
ALTER TABLE "RFQ" ADD COLUMN IF NOT EXISTS "createdByName"   TEXT;
ALTER TABLE "RFQ" ADD COLUMN IF NOT EXISTS "publishedAt"     TIMESTAMP;
ALTER TABLE "RFQ" ADD COLUMN IF NOT EXISTS "awardedAt"       TIMESTAMP;
ALTER TABLE "RFQ" ADD COLUMN IF NOT EXISTS "awardedBidId"    TEXT;
ALTER TABLE "RFQ" ADD COLUMN IF NOT EXISTS notes             TEXT;
ALTER TABLE "RFQ" ADD COLUMN IF NOT EXISTS "updatedAt"       TIMESTAMP DEFAULT NOW();

-- ##########################################################################
-- PART 2 — RFQLine
-- ##########################################################################
CREATE TABLE IF NOT EXISTS "RFQLine" (
  id             TEXT PRIMARY KEY,
  "organizationId" TEXT NOT NULL,
  "rfqId"        TEXT NOT NULL,
  "lineNumber"   INTEGER,
  description    TEXT,
  quantity       NUMERIC(18,3) DEFAULT 0,
  "unitOfMeasure" TEXT DEFAULT 'UNIT',
  specifications TEXT,
  "targetPrice"  NUMERIC(18,2) DEFAULT 0,
  notes          TEXT,
  "createdAt"    TIMESTAMP DEFAULT NOW(),
  "updatedAt"    TIMESTAMP DEFAULT NOW()
);

-- ##########################################################################
-- PART 3 — RFQSupplierInvite
-- ##########################################################################
CREATE TABLE IF NOT EXISTS "RFQSupplierInvite" (
  id             TEXT PRIMARY KEY,
  "organizationId" TEXT NOT NULL,
  "rfqId"        TEXT NOT NULL,
  "supplierId"   TEXT NOT NULL,
  "invitedAt"    TIMESTAMP DEFAULT NOW(),
  "respondedAt"  TIMESTAMP,
  status         TEXT DEFAULT 'INVITED',
  "inviteToken"  TEXT,
  notes          TEXT,
  "createdAt"    TIMESTAMP DEFAULT NOW(),
  "updatedAt"    TIMESTAMP DEFAULT NOW()
);

-- ##########################################################################
-- PART 4 — SupplierQuoteExt (rich quotes)
-- ##########################################################################
CREATE TABLE IF NOT EXISTS "SupplierQuoteExt" (
  id             TEXT PRIMARY KEY,
  "organizationId" TEXT NOT NULL,
  "rfqId"        TEXT NOT NULL,
  "rfqLineId"    TEXT,
  "supplierId"   TEXT NOT NULL,
  quantity       NUMERIC(18,3) DEFAULT 0,
  "unitPrice"    NUMERIC(18,2) DEFAULT 0,
  "taxRate"      NUMERIC(5,2)  DEFAULT 0,
  "lineTotal"    NUMERIC(18,2) DEFAULT 0,
  currency       TEXT DEFAULT 'KES',
  "leadTimeDays" INTEGER,
  incoterms      TEXT,
  "validUntil"   TIMESTAMP,
  status         TEXT DEFAULT 'DRAFT',
  notes          TEXT,
  "submittedAt"  TIMESTAMP,
  "createdAt"    TIMESTAMP DEFAULT NOW(),
  "updatedAt"    TIMESTAMP DEFAULT NOW()
);

-- ##########################################################################
-- PART 5 — Indexes
-- ##########################################################################
CREATE INDEX IF NOT EXISTS "RFQ_org_status_idx"
  ON "RFQ" ("organizationId", status);
CREATE INDEX IF NOT EXISTS "RFQ_org_closing_idx"
  ON "RFQ" ("organizationId", "closingDate");
CREATE INDEX IF NOT EXISTS "RFQ_org_rfqNumber_idx"
  ON "RFQ" ("organizationId", "rfqNumber");
CREATE INDEX IF NOT EXISTS "RFQ_org_requisition_idx"
  ON "RFQ" ("organizationId", "requisitionId");

CREATE INDEX IF NOT EXISTS "RFQLine_org_rfq_idx"
  ON "RFQLine" ("organizationId", "rfqId");

CREATE INDEX IF NOT EXISTS "RFQSupplierInvite_org_rfq_idx"
  ON "RFQSupplierInvite" ("organizationId", "rfqId");
CREATE INDEX IF NOT EXISTS "RFQSupplierInvite_org_supplier_idx"
  ON "RFQSupplierInvite" ("organizationId", "supplierId");
CREATE INDEX IF NOT EXISTS "RFQSupplierInvite_org_status_idx"
  ON "RFQSupplierInvite" ("organizationId", status);

CREATE INDEX IF NOT EXISTS "SupplierQuoteExt_org_rfq_idx"
  ON "SupplierQuoteExt" ("organizationId", "rfqId");
CREATE INDEX IF NOT EXISTS "SupplierQuoteExt_org_supplier_idx"
  ON "SupplierQuoteExt" ("organizationId", "supplierId");
CREATE INDEX IF NOT EXISTS "SupplierQuoteExt_org_status_idx"
  ON "SupplierQuoteExt" ("organizationId", status);

-- ##########################################################################
-- PART 6 — Seed ProcurementNumbering for scope='RFQ' per org
-- ##########################################################################
INSERT INTO "ProcurementNumbering"
  (id, "organizationId", scope, prefix, year, counter, "createdAt", "updatedAt")
SELECT
  gen_random_uuid()::text,
  o.id,
  'RFQ',
  'RFQ',
  EXTRACT(YEAR FROM NOW())::int,
  0,
  NOW(),
  NOW()
FROM "Organization" o
WHERE NOT EXISTS (
  SELECT 1 FROM "ProcurementNumbering" pn
  WHERE pn."organizationId" = o.id
    AND pn.scope = 'RFQ'
    AND pn.year = EXTRACT(YEAR FROM NOW())::int
);

COMMIT;

-- ##########################################################################
-- PART 7 — Verification
-- ##########################################################################
SELECT
  (SELECT COUNT(*) FROM information_schema.columns
   WHERE table_schema='public' AND table_name='RFQ'
     AND column_name IN ('rfqNumber','description','type','category','currency',
       'requisitionId','purchaseOrderId','issueDate','closingDate','deliveryDate',
       'deliveryLocation','paymentTerms','evaluationCriteria','createdBy','createdByName',
       'publishedAt','awardedAt','awardedBidId','notes','updatedAt')) AS rfq_new_cols,
  (SELECT COUNT(*) FROM information_schema.tables
   WHERE table_schema='public' AND table_name='RFQLine') AS rfql_table,
  (SELECT COUNT(*) FROM information_schema.columns
   WHERE table_schema='public' AND table_name='RFQLine') AS rfql_cols,
  (SELECT COUNT(*) FROM information_schema.tables
   WHERE table_schema='public' AND table_name='RFQSupplierInvite') AS rfi_table,
  (SELECT COUNT(*) FROM information_schema.columns
   WHERE table_schema='public' AND table_name='RFQSupplierInvite') AS rfi_cols,
  (SELECT COUNT(*) FROM information_schema.tables
   WHERE table_schema='public' AND table_name='SupplierQuoteExt') AS sqe_table,
  (SELECT COUNT(*) FROM information_schema.columns
   WHERE table_schema='public' AND table_name='SupplierQuoteExt') AS sqe_cols,
  (SELECT COUNT(*) FROM "ProcurementNumbering" WHERE scope='RFQ') AS rfq_seeded;

-- Expected:
--   rfq_new_cols: 20
--   rfql_table: 1,  rfql_cols: 12
--   rfi_table: 1,   rfi_cols: 11
--   sqe_table: 1,   sqe_cols: 18
--   rfq_seeded: >= 1