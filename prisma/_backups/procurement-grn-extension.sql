-- ==========================================================================
-- PROCUREMENT PHASE 4 — Goods Receipt + Quality Inspection Extension
-- Idempotent, additive. Safe to re-run. No drops. No renames.
-- ==========================================================================

BEGIN;

-- ##########################################################################
-- PART 1 — Extend GoodsReceipt
-- ##########################################################################
ALTER TABLE "GoodsReceipt" ADD COLUMN IF NOT EXISTS "grnNumber" TEXT;
ALTER TABLE "GoodsReceipt" ADD COLUMN IF NOT EXISTS "receivedBy" TEXT;
ALTER TABLE "GoodsReceipt" ADD COLUMN IF NOT EXISTS "receivedByName" TEXT;
ALTER TABLE "GoodsReceipt" ADD COLUMN IF NOT EXISTS "status" TEXT DEFAULT 'DRAFT';
ALTER TABLE "GoodsReceipt" ADD COLUMN IF NOT EXISTS "deliveryNoteNumber" TEXT;
ALTER TABLE "GoodsReceipt" ADD COLUMN IF NOT EXISTS "deliveryNoteUrl" TEXT;
ALTER TABLE "GoodsReceipt" ADD COLUMN IF NOT EXISTS "vehicleNumber" TEXT;
ALTER TABLE "GoodsReceipt" ADD COLUMN IF NOT EXISTS "driverName" TEXT;
ALTER TABLE "GoodsReceipt" ADD COLUMN IF NOT EXISTS "warehouseId" TEXT;
ALTER TABLE "GoodsReceipt" ADD COLUMN IF NOT EXISTS "locationId" TEXT;
ALTER TABLE "GoodsReceipt" ADD COLUMN IF NOT EXISTS "currency" TEXT DEFAULT 'KES';
ALTER TABLE "GoodsReceipt" ADD COLUMN IF NOT EXISTS "totalReceived" NUMERIC(18,2) DEFAULT 0;
ALTER TABLE "GoodsReceipt" ADD COLUMN IF NOT EXISTS "hasVariance" BOOLEAN DEFAULT FALSE;
ALTER TABLE "GoodsReceipt" ADD COLUMN IF NOT EXISTS "notes" TEXT;
ALTER TABLE "GoodsReceipt" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP DEFAULT NOW();
ALTER TABLE "GoodsReceipt" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP DEFAULT NOW();

-- ##########################################################################
-- PART 2 — Extend GoodsReceiptLine
-- ##########################################################################
ALTER TABLE "GoodsReceiptLine" ADD COLUMN IF NOT EXISTS "purchaseOrderItemId" TEXT;
ALTER TABLE "GoodsReceiptLine" ADD COLUMN IF NOT EXISTS "organizationId" TEXT;
ALTER TABLE "GoodsReceiptLine" ADD COLUMN IF NOT EXISTS "productId" TEXT;
ALTER TABLE "GoodsReceiptLine" ADD COLUMN IF NOT EXISTS "unitOfMeasure" TEXT DEFAULT 'UNIT';
ALTER TABLE "GoodsReceiptLine" ADD COLUMN IF NOT EXISTS "orderedQty" NUMERIC(18,3) DEFAULT 0;
ALTER TABLE "GoodsReceiptLine" ADD COLUMN IF NOT EXISTS "receivedQty" NUMERIC(18,3) DEFAULT 0;
ALTER TABLE "GoodsReceiptLine" ADD COLUMN IF NOT EXISTS "rejectedQty" NUMERIC(18,3) DEFAULT 0;
ALTER TABLE "GoodsReceiptLine" ADD COLUMN IF NOT EXISTS "damagedQty" NUMERIC(18,3) DEFAULT 0;
ALTER TABLE "GoodsReceiptLine" ADD COLUMN IF NOT EXISTS "unitPrice" NUMERIC(18,2) DEFAULT 0;
ALTER TABLE "GoodsReceiptLine" ADD COLUMN IF NOT EXISTS "taxRate" NUMERIC(5,2) DEFAULT 0;
ALTER TABLE "GoodsReceiptLine" ADD COLUMN IF NOT EXISTS "lineTotal" NUMERIC(18,2) DEFAULT 0;
ALTER TABLE "GoodsReceiptLine" ADD COLUMN IF NOT EXISTS "serialNumbers" TEXT;
ALTER TABLE "GoodsReceiptLine" ADD COLUMN IF NOT EXISTS "batchNumber" TEXT;
ALTER TABLE "GoodsReceiptLine" ADD COLUMN IF NOT EXISTS "lotNumber" TEXT;
ALTER TABLE "GoodsReceiptLine" ADD COLUMN IF NOT EXISTS "expiryDate" TIMESTAMP;
ALTER TABLE "GoodsReceiptLine" ADD COLUMN IF NOT EXISTS "condition" TEXT DEFAULT 'GOOD';
ALTER TABLE "GoodsReceiptLine" ADD COLUMN IF NOT EXISTS "notes" TEXT;
ALTER TABLE "GoodsReceiptLine" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP DEFAULT NOW();
ALTER TABLE "GoodsReceiptLine" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP DEFAULT NOW();

-- ##########################################################################
-- PART 3 — Extend QualityInspection
-- ##########################################################################
ALTER TABLE "QualityInspection" ADD COLUMN IF NOT EXISTS "organizationId" TEXT;
ALTER TABLE "QualityInspection" ADD COLUMN IF NOT EXISTS "goodsReceiptLineId" TEXT;
ALTER TABLE "QualityInspection" ADD COLUMN IF NOT EXISTS "purchaseOrderItemId" TEXT;
ALTER TABLE "QualityInspection" ADD COLUMN IF NOT EXISTS "inspectorId" TEXT;
ALTER TABLE "QualityInspection" ADD COLUMN IF NOT EXISTS "inspectorName" TEXT;
ALTER TABLE "QualityInspection" ADD COLUMN IF NOT EXISTS "status" TEXT DEFAULT 'PENDING';
ALTER TABLE "QualityInspection" ADD COLUMN IF NOT EXISTS "inspectedAt" TIMESTAMP;
ALTER TABLE "QualityInspection" ADD COLUMN IF NOT EXISTS "sampleSize" INTEGER;
ALTER TABLE "QualityInspection" ADD COLUMN IF NOT EXISTS "passedQty" NUMERIC(18,3);
ALTER TABLE "QualityInspection" ADD COLUMN IF NOT EXISTS "failedQty" NUMERIC(18,3);
ALTER TABLE "QualityInspection" ADD COLUMN IF NOT EXISTS "findings" TEXT;
ALTER TABLE "QualityInspection" ADD COLUMN IF NOT EXISTS "correctiveAction" TEXT;
ALTER TABLE "QualityInspection" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP DEFAULT NOW();
ALTER TABLE "QualityInspection" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP DEFAULT NOW();

-- ##########################################################################
-- PART 4 — Indexes
-- ##########################################################################
CREATE INDEX IF NOT EXISTS "GoodsReceipt_org_status_idx"
  ON "GoodsReceipt" ("organizationId", status);
CREATE INDEX IF NOT EXISTS "GoodsReceipt_org_po_idx"
  ON "GoodsReceipt" ("organizationId", "purchaseOrderId");
CREATE INDEX IF NOT EXISTS "GoodsReceipt_org_grnNumber_idx"
  ON "GoodsReceipt" ("organizationId", "grnNumber");

CREATE INDEX IF NOT EXISTS "GoodsReceiptLine_org_grn_idx"
  ON "GoodsReceiptLine" ("organizationId", "goodsReceiptId");
CREATE INDEX IF NOT EXISTS "GoodsReceiptLine_po_item_idx"
  ON "GoodsReceiptLine" ("purchaseOrderItemId");

CREATE INDEX IF NOT EXISTS "QualityInspection_org_status_idx"
  ON "QualityInspection" ("organizationId", status);
CREATE INDEX IF NOT EXISTS "QualityInspection_grn_idx"
  ON "QualityInspection" ("goodsReceiptId");

COMMIT;

-- ##########################################################################
-- PART 5 — Foreign keys (each in guarded block)
-- ##########################################################################
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'GoodsReceiptLine_grnId_fkey') THEN
    BEGIN
      ALTER TABLE "GoodsReceiptLine" ADD CONSTRAINT "GoodsReceiptLine_grnId_fkey"
        FOREIGN KEY ("goodsReceiptId") REFERENCES "GoodsReceipt"("id") ON DELETE CASCADE;
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'Skipping GoodsReceiptLine_grnId_fkey: %', SQLERRM;
    END;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'QualityInspection_grnId_fkey') THEN
    BEGIN
      ALTER TABLE "QualityInspection" ADD CONSTRAINT "QualityInspection_grnId_fkey"
        FOREIGN KEY ("goodsReceiptId") REFERENCES "GoodsReceipt"("id") ON DELETE SET NULL;
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'Skipping QualityInspection_grnId_fkey: %', SQLERRM;
    END;
  END IF;
END $$;

-- ==========================================================================
-- Verification
-- ==========================================================================
SELECT
  (SELECT COUNT(*) FROM information_schema.columns
   WHERE table_schema='public' AND table_name='GoodsReceipt'
     AND column_name IN ('grnNumber','receivedBy','receivedByName','status',
       'deliveryNoteNumber','deliveryNoteUrl','vehicleNumber','driverName',
       'warehouseId','locationId','currency','totalReceived','hasVariance',
       'notes','createdAt','updatedAt')) AS grn_new_cols,
  (SELECT COUNT(*) FROM information_schema.columns
   WHERE table_schema='public' AND table_name='GoodsReceiptLine'
     AND column_name IN ('purchaseOrderItemId','organizationId','productId',
       'unitOfMeasure','orderedQty','receivedQty','rejectedQty','damagedQty',
       'unitPrice','taxRate','lineTotal','serialNumbers','batchNumber',
       'lotNumber','expiryDate','condition','notes','createdAt','updatedAt')) AS grl_new_cols,
  (SELECT COUNT(*) FROM information_schema.columns
   WHERE table_schema='public' AND table_name='QualityInspection'
     AND column_name IN ('organizationId','goodsReceiptLineId','purchaseOrderItemId',
       'inspectorId','inspectorName','status','inspectedAt','sampleSize',
       'passedQty','failedQty','findings','correctiveAction','createdAt','updatedAt')) AS qi_new_cols;