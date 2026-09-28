-- ==========================================================================
-- PROCUREMENT PHASE 8 — Approval Chain Configuration
-- Idempotent, additive, transactional. No drops. No renames.
-- ==========================================================================

BEGIN;

-- ##########################################################################
-- PART 1 — ApprovalChain
-- ##########################################################################
CREATE TABLE IF NOT EXISTS "ApprovalChain" (
  id                TEXT PRIMARY KEY,
  "organizationId"  TEXT NOT NULL,
  name              TEXT,
  "documentType"    TEXT NOT NULL,   -- REQUISITION | PURCHASE_ORDER | SUPPLIER_INVOICE | PAYMENT_RUN | CONTRACT
  "minAmount"       NUMERIC(18,2),
  "maxAmount"       NUMERIC(18,2),
  currency          TEXT DEFAULT 'KES',
  "isActive"        BOOLEAN DEFAULT TRUE,
  priority          INTEGER DEFAULT 100,
  notes             TEXT,
  "createdBy"       TEXT,
  "createdByName"   TEXT,
  "createdAt"       TIMESTAMP DEFAULT NOW(),
  "updatedAt"       TIMESTAMP DEFAULT NOW()
);

-- ##########################################################################
-- PART 2 — ApprovalStep
-- ##########################################################################
CREATE TABLE IF NOT EXISTS "ApprovalStep" (
  id                 TEXT PRIMARY KEY,
  "organizationId"   TEXT NOT NULL,
  "chainId"          TEXT NOT NULL,
  "stepNumber"       INTEGER NOT NULL,
  name               TEXT,
  "approverRole"     TEXT,            -- BUYER | APPROVER | FINANCE | ADMIN
  "approverUserId"   TEXT,
  "approverUserName" TEXT,
  "isRequired"       BOOLEAN DEFAULT TRUE,
  "slaHours"         INTEGER DEFAULT 48,
  notes              TEXT,
  "createdAt"        TIMESTAMP DEFAULT NOW(),
  "updatedAt"        TIMESTAMP DEFAULT NOW()
);

-- ##########################################################################
-- PART 3 — Indexes
-- ##########################################################################
CREATE INDEX IF NOT EXISTS "ApprovalChain_org_docType_idx"
  ON "ApprovalChain" ("organizationId", "documentType");
CREATE INDEX IF NOT EXISTS "ApprovalChain_org_active_idx"
  ON "ApprovalChain" ("organizationId", "isActive");

CREATE INDEX IF NOT EXISTS "ApprovalStep_org_chain_idx"
  ON "ApprovalStep" ("organizationId", "chainId");
CREATE INDEX IF NOT EXISTS "ApprovalStep_chain_step_idx"
  ON "ApprovalStep" ("chainId", "stepNumber");

-- ##########################################################################
-- PART 4 — Seed 4 default chains per org (only if org has none yet)
-- ##########################################################################
DO $$
DECLARE
  o RECORD;
  low_po_id   TEXT;
  mid_po_id   TEXT;
  high_po_id  TEXT;
  payrun_id   TEXT;
BEGIN
  FOR o IN SELECT id FROM "Organization"
  LOOP
    -- Skip if this org already has chains
    IF EXISTS (SELECT 1 FROM "ApprovalChain" WHERE "organizationId" = o.id) THEN
      CONTINUE;
    END IF;

    -- 1. Standard PO — low value (0 → 100k) — 1 step APPROVER
    low_po_id := gen_random_uuid()::text;
    INSERT INTO "ApprovalChain"
      (id, "organizationId", name, "documentType", "minAmount", "maxAmount",
       currency, "isActive", priority, "createdAt", "updatedAt")
    VALUES
      (low_po_id, o.id, 'Standard PO — low value', 'PURCHASE_ORDER', 0, 100000,
       'KES', TRUE, 100, NOW(), NOW());

    INSERT INTO "ApprovalStep"
      (id, "organizationId", "chainId", "stepNumber", name, "approverRole",
       "isRequired", "slaHours", "createdAt", "updatedAt")
    VALUES
      (gen_random_uuid()::text, o.id, low_po_id, 1, 'Approver review', 'APPROVER',
       TRUE, 48, NOW(), NOW());

    -- 2. Standard PO — mid value (100k → 1M) — APPROVER then FINANCE
    mid_po_id := gen_random_uuid()::text;
    INSERT INTO "ApprovalChain"
      (id, "organizationId", name, "documentType", "minAmount", "maxAmount",
       currency, "isActive", priority, "createdAt", "updatedAt")
    VALUES
      (mid_po_id, o.id, 'Standard PO — mid value', 'PURCHASE_ORDER', 100000.01, 1000000,
       'KES', TRUE, 100, NOW(), NOW());

    INSERT INTO "ApprovalStep"
      (id, "organizationId", "chainId", "stepNumber", name, "approverRole",
       "isRequired", "slaHours", "createdAt", "updatedAt")
    VALUES
      (gen_random_uuid()::text, o.id, mid_po_id, 1, 'Approver review', 'APPROVER',
       TRUE, 48, NOW(), NOW()),
      (gen_random_uuid()::text, o.id, mid_po_id, 2, 'Finance review', 'FINANCE',
       TRUE, 48, NOW(), NOW());

    -- 3. High-value PO (>1M) — APPROVER → FINANCE → ADMIN
    high_po_id := gen_random_uuid()::text;
    INSERT INTO "ApprovalChain"
      (id, "organizationId", name, "documentType", "minAmount", "maxAmount",
       currency, "isActive", priority, "createdAt", "updatedAt")
    VALUES
      (high_po_id, o.id, 'High-value PO', 'PURCHASE_ORDER', 1000000.01, NULL,
       'KES', TRUE, 100, NOW(), NOW());

    INSERT INTO "ApprovalStep"
      (id, "organizationId", "chainId", "stepNumber", name, "approverRole",
       "isRequired", "slaHours", "createdAt", "updatedAt")
    VALUES
      (gen_random_uuid()::text, o.id, high_po_id, 1, 'Approver review', 'APPROVER',
       TRUE, 48, NOW(), NOW()),
      (gen_random_uuid()::text, o.id, high_po_id, 2, 'Finance review', 'FINANCE',
       TRUE, 48, NOW(), NOW()),
      (gen_random_uuid()::text, o.id, high_po_id, 3, 'Executive sign-off', 'ADMIN',
       TRUE, 72, NOW(), NOW());

    -- 4. Payment run — always FINANCE
    payrun_id := gen_random_uuid()::text;
    INSERT INTO "ApprovalChain"
      (id, "organizationId", name, "documentType", "minAmount", "maxAmount",
       currency, "isActive", priority, "createdAt", "updatedAt")
    VALUES
      (payrun_id, o.id, 'Payment run — finance approval', 'PAYMENT_RUN', 0, NULL,
       'KES', TRUE, 100, NOW(), NOW());

    INSERT INTO "ApprovalStep"
      (id, "organizationId", "chainId", "stepNumber", name, "approverRole",
       "isRequired", "slaHours", "createdAt", "updatedAt")
    VALUES
      (gen_random_uuid()::text, o.id, payrun_id, 1, 'Finance approval', 'FINANCE',
       TRUE, 24, NOW(), NOW());
  END LOOP;
END $$;

COMMIT;

-- ##########################################################################
-- PART 5 — Verification
-- ##########################################################################
SELECT
  (SELECT COUNT(*) FROM information_schema.tables
   WHERE table_schema='public' AND table_name='ApprovalChain') AS ac_table,
  (SELECT COUNT(*) FROM information_schema.columns
   WHERE table_schema='public' AND table_name='ApprovalChain') AS ac_cols,
  (SELECT COUNT(*) FROM information_schema.tables
   WHERE table_schema='public' AND table_name='ApprovalStep') AS as_table,
  (SELECT COUNT(*) FROM information_schema.columns
   WHERE table_schema='public' AND table_name='ApprovalStep') AS as_cols,
  (SELECT COUNT(*) FROM "ApprovalChain") AS chains_seeded,
  (SELECT COUNT(*) FROM "ApprovalStep") AS steps_seeded;

-- Expected (per 2 orgs):
--   ac_table 1,  ac_cols ~14
--   as_table 1,  as_cols ~12
--   chains_seeded = 8
--   steps_seeded  = 16