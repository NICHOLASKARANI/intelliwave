-- ==========================================================================
-- PROCUREMENT PHASE 8 — Roles & Permissions (RBAC)
-- Idempotent, additive, transactional. No drops. No renames.
-- ==========================================================================

BEGIN;

-- ##########################################################################
-- PART 1 — ProcurementRole (definitions per org)
-- ##########################################################################
CREATE TABLE IF NOT EXISTS "ProcurementRole" (
  id                 TEXT PRIMARY KEY,
  "organizationId"   TEXT NOT NULL,
  role               TEXT NOT NULL,
  name               TEXT,
  description        TEXT,
  "canCreatePOs"     BOOLEAN DEFAULT FALSE,
  "canApprovePOs"    BOOLEAN DEFAULT FALSE,
  "canReceiveGoods"  BOOLEAN DEFAULT FALSE,
  "canApproveInvoices" BOOLEAN DEFAULT FALSE,
  "canExecutePayments" BOOLEAN DEFAULT FALSE,
  "canManageSuppliers" BOOLEAN DEFAULT FALSE,
  "canManageContracts" BOOLEAN DEFAULT FALSE,
  "canManageRFQs"    BOOLEAN DEFAULT FALSE,
  "canAdmin"         BOOLEAN DEFAULT FALSE,
  "createdAt"        TIMESTAMP DEFAULT NOW(),
  "updatedAt"        TIMESTAMP DEFAULT NOW(),
  UNIQUE ("organizationId", role)
);

-- ##########################################################################
-- PART 2 — ProcurementUserRole (assignments)
-- ##########################################################################
CREATE TABLE IF NOT EXISTS "ProcurementUserRole" (
  id                 TEXT PRIMARY KEY,
  "organizationId"   TEXT NOT NULL,
  "userId"           TEXT NOT NULL,
  "userName"         TEXT,
  role               TEXT NOT NULL,
  status             TEXT DEFAULT 'ACTIVE',
  "assignedAt"       TIMESTAMP DEFAULT NOW(),
  "assignedBy"       TEXT,
  "assignedByName"   TEXT,
  "revokedAt"        TIMESTAMP,
  "createdAt"        TIMESTAMP DEFAULT NOW(),
  "updatedAt"        TIMESTAMP DEFAULT NOW(),
  UNIQUE ("organizationId", "userId", role)
);

-- ##########################################################################
-- PART 3 — Indexes
-- ##########################################################################
CREATE INDEX IF NOT EXISTS "ProcurementRole_org_role_idx"
  ON "ProcurementRole" ("organizationId", role);

CREATE INDEX IF NOT EXISTS "ProcurementUserRole_org_user_idx"
  ON "ProcurementUserRole" ("organizationId", "userId");
CREATE INDEX IF NOT EXISTS "ProcurementUserRole_org_role_idx"
  ON "ProcurementUserRole" ("organizationId", role);
CREATE INDEX IF NOT EXISTS "ProcurementUserRole_org_status_idx"
  ON "ProcurementUserRole" ("organizationId", status);

-- ##########################################################################
-- PART 4 — Seed default role definitions per org
-- ##########################################################################
WITH defaults (role, name, description, cp, ap, rg, ai, ep, ms, mc, mr, adm) AS (
  VALUES
    ('VIEWER',   'Viewer',   'Read-only access to procurement',           FALSE,FALSE,FALSE,FALSE,FALSE,FALSE,FALSE,FALSE,FALSE),
    ('BUYER',    'Buyer',    'Creates POs, RFQs, GRNs; manages suppliers', TRUE, FALSE,TRUE, FALSE,FALSE,TRUE, FALSE,TRUE, FALSE),
    ('APPROVER', 'Approver', 'Approves POs and supplier invoices',         FALSE,TRUE, FALSE,TRUE, FALSE,FALSE,FALSE,FALSE,FALSE),
    ('FINANCE',  'Finance',  'Approves invoices, executes payment runs',   FALSE,FALSE,FALSE,TRUE, TRUE, FALSE,TRUE, FALSE,FALSE),
    ('ADMIN',    'Admin',    'Full control including settings',            TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE)
)
INSERT INTO "ProcurementRole"
  (id, "organizationId", role, name, description,
   "canCreatePOs","canApprovePOs","canReceiveGoods","canApproveInvoices",
   "canExecutePayments","canManageSuppliers","canManageContracts","canManageRFQs","canAdmin",
   "createdAt","updatedAt")
SELECT
  gen_random_uuid()::text,
  o.id,
  d.role, d.name, d.description,
  d.cp, d.ap, d.rg, d.ai, d.ep, d.ms, d.mc, d.mr, d.adm,
  NOW(), NOW()
FROM "Organization" o
CROSS JOIN defaults d
WHERE NOT EXISTS (
  SELECT 1 FROM "ProcurementRole" pr
  WHERE pr."organizationId" = o.id AND pr.role = d.role
);

COMMIT;

-- ##########################################################################
-- PART 5 — Verification
-- ##########################################################################
SELECT
  (SELECT COUNT(*) FROM information_schema.tables
   WHERE table_schema='public' AND table_name='ProcurementRole') AS pr_table,
  (SELECT COUNT(*) FROM information_schema.columns
   WHERE table_schema='public' AND table_name='ProcurementRole') AS pr_cols,
  (SELECT COUNT(*) FROM information_schema.tables
   WHERE table_schema='public' AND table_name='ProcurementUserRole') AS pur_table,
  (SELECT COUNT(*) FROM information_schema.columns
   WHERE table_schema='public' AND table_name='ProcurementUserRole') AS pur_cols,
  (SELECT COUNT(*) FROM "ProcurementRole") AS roles_seeded,
  (SELECT COUNT(DISTINCT "organizationId") FROM "ProcurementRole") AS orgs_covered;

-- Expected:
--   pr_table 1,  pr_cols ~17
--   pur_table 1, pur_cols ~14
--   roles_seeded = 5 × #orgs
--   orgs_covered = #orgs