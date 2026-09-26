-- ==========================================================================
-- PROCUREMENT PHASE 5 — Supplier Invoice + 3-Way Match extension (FIXED)
-- Corrected for actual ProcurementNumbering schema:
--   columns: id, organizationId, scope, prefix, year, counter, timestamps
-- Idempotent, additive, safe to re-run. No drops. No renames.
-- ==========================================================================

BEGIN;

-- ##########################################################################
-- PART 1 — SupplierInvoice header
-- ##########################################################################
CREATE TABLE IF NOT EXISTS "SupplierInvoice" (
  id                   TEXT PRIMARY KEY,
  "organizationId"     TEXT NOT NULL,
  "invoiceNumber"      TEXT,
  "supplierInvoiceRef" TEXT,
  "purchaseOrderId"    TEXT,
  "goodsReceiptId"     TEXT,
  "supplierId"         TEXT,
  "supplierName"       TEXT,
  "invoiceDate"        TIMESTAMP,
  "dueDate"            TIMESTAMP,
  currency             TEXT DEFAULT 'KES',
  subtotal             NUMERIC(18,2) DEFAULT 0,
  "taxAmount"          NUMERIC(18,2) DEFAULT 0,
  total                NUMERIC(18,2) DEFAULT 0,
  status               TEXT DEFAULT 'DRAFT',
  "matchStatus"        TEXT DEFAULT 'UNMATCHED',
  "matchNotes"         TEXT,
  "approvedAt"         TIMESTAMP,
  "approvedBy"         TEXT,
  "approvedByName"     TEXT,
  "paidAt"             TIMESTAMP,
  "paymentReference"   TEXT,
  "receivedBy"         TEXT,
  "receivedByName"     TEXT,
  notes                TEXT,
  "createdAt"          TIMESTAMP DEFAULT NOW(),
  "updatedAt"          TIMESTAMP DEFAULT NOW()
);

-- ##########################################################################
-- PART 2 — SupplierInvoiceLine
-- ##########################################################################
CREATE TABLE IF NOT EXISTS "SupplierInvoiceLine" (
  id                    TEXT PRIMARY KEY,
  "organizationId"      TEXT NOT NULL,
  "supplierInvoiceId"   TEXT NOT NULL,
  "lineNumber"          INTEGER,
  description           TEXT,
  "purchaseOrderItemId" TEXT,
  "goodsReceiptLineId"  TEXT,
  quantity              NUMERIC(18,3) DEFAULT 0,
  "unitPrice"           NUMERIC(18,2) DEFAULT 0,
  "taxRate"             NUMERIC(5,2) DEFAULT 0,
  "lineTotal"           NUMERIC(18,2) DEFAULT 0,
  "matchedQty"          NUMERIC(18,3) DEFAULT 0,
  "matchedAmount"       NUMERIC(18,2) DEFAULT 0,
  "matchStatus"         TEXT DEFAULT 'UNMATCHED',
  "matchNotes"          TEXT,
  notes                 TEXT,
  "createdAt"           TIMESTAMP DEFAULT NOW(),
  "updatedAt"           TIMESTAMP DEFAULT NOW()
);

-- ##########################################################################
-- PART 3 — Indexes
-- ##########################################################################
CREATE INDEX IF NOT EXISTS "SupplierInvoice_org_status_idx"
  ON "SupplierInvoice" ("organizationId", status);
CREATE INDEX IF NOT EXISTS "SupplierInvoice_org_matchStatus_idx"
  ON "SupplierInvoice" ("organizationId", "matchStatus");
CREATE INDEX IF NOT EXISTS "SupplierInvoice_org_po_idx"
  ON "SupplierInvoice" ("organizationId", "purchaseOrderId");
CREATE INDEX IF NOT EXISTS "SupplierInvoice_org_supplier_idx"
  ON "SupplierInvoice" ("organizationId", "supplierId");
CREATE INDEX IF NOT EXISTS "SupplierInvoice_org_invoiceNumber_idx"
  ON "SupplierInvoice" ("organizationId", "invoiceNumber");

CREATE INDEX IF NOT EXISTS "SupplierInvoiceLine_org_invoice_idx"
  ON "SupplierInvoiceLine" ("organizationId", "supplierInvoiceId");
CREATE INDEX IF NOT EXISTS "SupplierInvoiceLine_po_item_idx"
  ON "SupplierInvoiceLine" ("purchaseOrderItemId");
CREATE INDEX IF NOT EXISTS "SupplierInvoiceLine_grn_line_idx"
  ON "SupplierInvoiceLine" ("goodsReceiptLineId");

-- ##########################################################################
-- PART 4 — Seed ProcurementNumbering for supplier invoices
--   Real schema: (id, organizationId, scope, prefix, year, counter, ...)
--   UNIQUE constraint appears to be (organizationId, scope, prefix, year)
-- ##########################################################################
INSERT INTO "ProcurementNumbering"
  (id, "organizationId", scope, prefix, year, counter, "createdAt", "updatedAt")
SELECT
  gen_random_uuid()::text,
  o.id,
  'SINV',
  'INV',
  EXTRACT(YEAR FROM NOW())::int,
  0,
  NOW(),
  NOW()
FROM "Organization" o
WHERE NOT EXISTS (
  SELECT 1 FROM "ProcurementNumbering" pn
  WHERE pn."organizationId" = o.id
    AND pn.scope = 'SINV'
    AND pn.year = EXTRACT(YEAR FROM NOW())::int
);

COMMIT;

-- ##########################################################################
-- PART 5 — Verification
-- ##########################################################################
SELECT
  (SELECT COUNT(*) FROM information_schema.tables
   WHERE table_schema='public' AND table_name='SupplierInvoice') AS si_table,
  (SELECT COUNT(*) FROM information_schema.columns
   WHERE table_schema='public' AND table_name='SupplierInvoice') AS si_cols,
  (SELECT COUNT(*) FROM information_schema.tables
   WHERE table_schema='public' AND table_name='SupplierInvoiceLine') AS sil_table,
  (SELECT COUNT(*) FROM information_schema.columns
   WHERE table_schema='public' AND table_name='SupplierInvoiceLine') AS sil_cols,
  (SELECT COUNT(*) FROM "ProcurementNumbering" WHERE scope='SINV') AS sinv_seeded;