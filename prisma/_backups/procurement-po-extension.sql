-- ==========================================================================
-- PROCUREMENT PHASE 3 — Purchase Order Extension
-- Idempotent, additive. Safe to re-run. No drops. No renames.
-- ==========================================================================

-- ##########################################################################
-- PART 1 — Extend PurchaseOrder with lifecycle columns
-- ##########################################################################
BEGIN;

ALTER TABLE "PurchaseOrder" ADD COLUMN IF NOT EXISTS "requisitionId" TEXT;
ALTER TABLE "PurchaseOrder" ADD COLUMN IF NOT EXISTS "type" TEXT DEFAULT 'STANDARD';
ALTER TABLE "PurchaseOrder" ADD COLUMN IF NOT EXISTS "currency" TEXT DEFAULT 'KES';
ALTER TABLE "PurchaseOrder" ADD COLUMN IF NOT EXISTS "paymentTerms" INTEGER DEFAULT 30;
ALTER TABLE "PurchaseOrder" ADD COLUMN IF NOT EXISTS "deliveryDate" TIMESTAMP;
ALTER TABLE "PurchaseOrder" ADD COLUMN IF NOT EXISTS "deliveryLocation" TEXT;
ALTER TABLE "PurchaseOrder" ADD COLUMN IF NOT EXISTS "incoterms" TEXT;

ALTER TABLE "PurchaseOrder" ADD COLUMN IF NOT EXISTS "sentAt" TIMESTAMP;
ALTER TABLE "PurchaseOrder" ADD COLUMN IF NOT EXISTS "sentBy" TEXT;
ALTER TABLE "PurchaseOrder" ADD COLUMN IF NOT EXISTS "acknowledgedAt" TIMESTAMP;
ALTER TABLE "PurchaseOrder" ADD COLUMN IF NOT EXISTS "acknowledgedBy" TEXT;

ALTER TABLE "PurchaseOrder" ADD COLUMN IF NOT EXISTS "approvedAt" TIMESTAMP;
ALTER TABLE "PurchaseOrder" ADD COLUMN IF NOT EXISTS "approvedBy" TEXT;
ALTER TABLE "PurchaseOrder" ADD COLUMN IF NOT EXISTS "rejectedAt" TIMESTAMP;
ALTER TABLE "PurchaseOrder" ADD COLUMN IF NOT EXISTS "rejectedBy" TEXT;
ALTER TABLE "PurchaseOrder" ADD COLUMN IF NOT EXISTS "rejectionReason" TEXT;

ALTER TABLE "PurchaseOrder" ADD COLUMN IF NOT EXISTS "currentApprovalStep" INTEGER DEFAULT 0;
ALTER TABLE "PurchaseOrder" ADD COLUMN IF NOT EXISTS "totalApprovalSteps" INTEGER DEFAULT 0;

ALTER TABLE "PurchaseOrder" ADD COLUMN IF NOT EXISTS "closedAt" TIMESTAMP;
ALTER TABLE "PurchaseOrder" ADD COLUMN IF NOT EXISTS "closedBy" TEXT;

ALTER TABLE "PurchaseOrder" ADD COLUMN IF NOT EXISTS "createdBy" TEXT;
ALTER TABLE "PurchaseOrder" ADD COLUMN IF NOT EXISTS "createdByName" TEXT;

-- ##########################################################################
-- PART 2 — Extend PurchaseOrderItem with line-item columns
-- ##########################################################################
ALTER TABLE "PurchaseOrderItem" ADD COLUMN IF NOT EXISTS "lineNumber" INTEGER;
ALTER TABLE "PurchaseOrderItem" ADD COLUMN IF NOT EXISTS "productId" TEXT;
ALTER TABLE "PurchaseOrderItem" ADD COLUMN IF NOT EXISTS "unitOfMeasure" TEXT DEFAULT 'UNIT';
ALTER TABLE "PurchaseOrderItem" ADD COLUMN IF NOT EXISTS "taxRate" NUMERIC(5,2) DEFAULT 0;
ALTER TABLE "PurchaseOrderItem" ADD COLUMN IF NOT EXISTS "receivedQty" NUMERIC(18,3) DEFAULT 0;
ALTER TABLE "PurchaseOrderItem" ADD COLUMN IF NOT EXISTS "invoicedQty" NUMERIC(18,3) DEFAULT 0;
ALTER TABLE "PurchaseOrderItem" ADD COLUMN IF NOT EXISTS "specifications" TEXT;
ALTER TABLE "PurchaseOrderItem" ADD COLUMN IF NOT EXISTS "organizationId" TEXT;

-- ##########################################################################
-- PART 3 — Indexes
-- ##########################################################################
CREATE INDEX IF NOT EXISTS "PurchaseOrder_org_status_idx"
  ON "PurchaseOrder" ("organizationId", status);

CREATE INDEX IF NOT EXISTS "PurchaseOrder_org_supplier_idx"
  ON "PurchaseOrder" ("organizationId", "supplierId");

CREATE INDEX IF NOT EXISTS "PurchaseOrder_org_requisition_idx"
  ON "PurchaseOrder" ("organizationId", "requisitionId");

CREATE INDEX IF NOT EXISTS "PurchaseOrder_org_created_idx"
  ON "PurchaseOrder" ("organizationId", "createdAt");

CREATE INDEX IF NOT EXISTS "PurchaseOrderItem_po_idx"
  ON "PurchaseOrderItem" ("purchaseOrderId");

CREATE INDEX IF NOT EXISTS "PurchaseOrderItem_org_idx"
  ON "PurchaseOrderItem" ("organizationId");

COMMIT;

-- ##########################################################################
-- PART 4 — Foreign keys (each in its own guarded block)
-- ##########################################################################
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'PurchaseOrder_requisitionId_fkey') THEN
    BEGIN
      ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_requisitionId_fkey"
        FOREIGN KEY ("requisitionId") REFERENCES "PurchaseRequisition"("id") ON DELETE SET NULL;
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'Skipping FK PurchaseOrder_requisitionId_fkey: %', SQLERRM;
    END;
  END IF;
END $$;

-- ==========================================================================
-- Verification
-- ==========================================================================
SELECT
  (SELECT COUNT(*) FROM information_schema.columns
   WHERE table_schema='public' AND table_name='PurchaseOrder'
     AND column_name IN ('requisitionId','type','currency','paymentTerms',
       'deliveryDate','deliveryLocation','incoterms','sentAt','sentBy',
       'acknowledgedAt','acknowledgedBy','approvedAt','approvedBy',
       'rejectedAt','rejectedBy','rejectionReason',
       'currentApprovalStep','totalApprovalSteps','closedAt','closedBy',
       'createdBy','createdByName')) AS po_new_cols,
  (SELECT COUNT(*) FROM information_schema.columns
   WHERE table_schema='public' AND table_name='PurchaseOrderItem'
     AND column_name IN ('lineNumber','productId','unitOfMeasure','taxRate',
       'receivedQty','invoicedQty','specifications','organizationId')) AS poi_new_cols,
  (SELECT COUNT(*) FROM pg_indexes
   WHERE schemaname='public' AND tablename='PurchaseOrder'
     AND indexname LIKE 'PurchaseOrder_%') AS po_indexes;