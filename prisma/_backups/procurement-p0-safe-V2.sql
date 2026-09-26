-- ==========================================================================
-- PROCUREMENT P0 — SAFE ADDITIVE MIGRATION V2
-- Generated: 2026-09-26
-- Strategy:  Additive only. No drops. No renames. Idempotent.
-- Fix:       All conditional logic inside DO $$ blocks. No bare IF.
-- ==========================================================================

-- ##########################################################################
-- PART 1 — Extend legacy tables with new nullable columns
-- ##########################################################################
BEGIN;

ALTER TABLE "Supplier" ADD COLUMN IF NOT EXISTS "code" TEXT;
ALTER TABLE "Supplier" ADD COLUMN IF NOT EXISTS "legalName" TEXT;
ALTER TABLE "Supplier" ADD COLUMN IF NOT EXISTS "tradingName" TEXT;
ALTER TABLE "Supplier" ADD COLUMN IF NOT EXISTS "registrationNumber" TEXT;
ALTER TABLE "Supplier" ADD COLUMN IF NOT EXISTS "taxPin" TEXT;
ALTER TABLE "Supplier" ADD COLUMN IF NOT EXISTS "vatStatus" TEXT DEFAULT 'NOT_REGISTERED';
ALTER TABLE "Supplier" ADD COLUMN IF NOT EXISTS "country" TEXT DEFAULT 'KE';
ALTER TABLE "Supplier" ADD COLUMN IF NOT EXISTS "county" TEXT;
ALTER TABLE "Supplier" ADD COLUMN IF NOT EXISTS "address" TEXT;
ALTER TABLE "Supplier" ADD COLUMN IF NOT EXISTS "city" TEXT;
ALTER TABLE "Supplier" ADD COLUMN IF NOT EXISTS "postalCode" TEXT;
ALTER TABLE "Supplier" ADD COLUMN IF NOT EXISTS "website" TEXT;
ALTER TABLE "Supplier" ADD COLUMN IF NOT EXISTS "primaryEmail" TEXT;
ALTER TABLE "Supplier" ADD COLUMN IF NOT EXISTS "primaryPhone" TEXT;
ALTER TABLE "Supplier" ADD COLUMN IF NOT EXISTS "currency" TEXT DEFAULT 'KES';
ALTER TABLE "Supplier" ADD COLUMN IF NOT EXISTS "paymentTerms" INTEGER DEFAULT 30;
ALTER TABLE "Supplier" ADD COLUMN IF NOT EXISTS "creditLimit" NUMERIC(18,2) DEFAULT 0;
ALTER TABLE "Supplier" ADD COLUMN IF NOT EXISTS "status" TEXT DEFAULT 'ACTIVE';
ALTER TABLE "Supplier" ADD COLUMN IF NOT EXISTS "isPreferred" BOOLEAN DEFAULT FALSE;
ALTER TABLE "Supplier" ADD COLUMN IF NOT EXISTS "isBlacklisted" BOOLEAN DEFAULT FALSE;
ALTER TABLE "Supplier" ADD COLUMN IF NOT EXISTS "blacklistReason" TEXT;
ALTER TABLE "Supplier" ADD COLUMN IF NOT EXISTS "notes" TEXT;
ALTER TABLE "Supplier" ADD COLUMN IF NOT EXISTS "riskScore" INTEGER DEFAULT 0;
ALTER TABLE "Supplier" ADD COLUMN IF NOT EXISTS "riskLevel" TEXT DEFAULT 'LOW';
ALTER TABLE "Supplier" ADD COLUMN IF NOT EXISTS "rating" INTEGER DEFAULT 0;
ALTER TABLE "Supplier" ADD COLUMN IF NOT EXISTS "onboardedAt" TIMESTAMP;
ALTER TABLE "Supplier" ADD COLUMN IF NOT EXISTS "createdBy" TEXT;
ALTER TABLE "Supplier" ADD COLUMN IF NOT EXISTS "updatedBy" TEXT;

ALTER TABLE "PurchaseOrder" ADD COLUMN IF NOT EXISTS "number" TEXT;
ALTER TABLE "PurchaseOrder" ADD COLUMN IF NOT EXISTS "date" TIMESTAMP DEFAULT NOW();
ALTER TABLE "PurchaseOrder" ADD COLUMN IF NOT EXISTS "subtotal" DOUBLE PRECISION DEFAULT 0;
ALTER TABLE "PurchaseOrder" ADD COLUMN IF NOT EXISTS "taxAmount" DOUBLE PRECISION DEFAULT 0;
ALTER TABLE "PurchaseOrder" ADD COLUMN IF NOT EXISTS "total" DOUBLE PRECISION DEFAULT 0;
ALTER TABLE "PurchaseOrder" ADD COLUMN IF NOT EXISTS "supplierId" TEXT;
ALTER TABLE "PurchaseOrder" ADD COLUMN IF NOT EXISTS "notes" TEXT;
ALTER TABLE "PurchaseOrder" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP DEFAULT NOW();

ALTER TABLE "PurchaseRequisition" ADD COLUMN IF NOT EXISTS "requisitionNumber" TEXT;
ALTER TABLE "PurchaseRequisition" ADD COLUMN IF NOT EXISTS "title" TEXT;
ALTER TABLE "PurchaseRequisition" ADD COLUMN IF NOT EXISTS "category" TEXT DEFAULT 'GENERAL';
ALTER TABLE "PurchaseRequisition" ADD COLUMN IF NOT EXISTS "priority" TEXT DEFAULT 'NORMAL';
ALTER TABLE "PurchaseRequisition" ADD COLUMN IF NOT EXISTS "type" TEXT DEFAULT 'STANDARD';
ALTER TABLE "PurchaseRequisition" ADD COLUMN IF NOT EXISTS "requestedBy" TEXT;
ALTER TABLE "PurchaseRequisition" ADD COLUMN IF NOT EXISTS "requestedByName" TEXT;
ALTER TABLE "PurchaseRequisition" ADD COLUMN IF NOT EXISTS "departmentId" TEXT;
ALTER TABLE "PurchaseRequisition" ADD COLUMN IF NOT EXISTS "projectId" TEXT;
ALTER TABLE "PurchaseRequisition" ADD COLUMN IF NOT EXISTS "costCenter" TEXT;
ALTER TABLE "PurchaseRequisition" ADD COLUMN IF NOT EXISTS "location" TEXT;
ALTER TABLE "PurchaseRequisition" ADD COLUMN IF NOT EXISTS "currency" TEXT DEFAULT 'KES';
ALTER TABLE "PurchaseRequisition" ADD COLUMN IF NOT EXISTS "subtotal" NUMERIC(18,2) DEFAULT 0;
ALTER TABLE "PurchaseRequisition" ADD COLUMN IF NOT EXISTS "taxAmount" NUMERIC(18,2) DEFAULT 0;
ALTER TABLE "PurchaseRequisition" ADD COLUMN IF NOT EXISTS "totalAmount" NUMERIC(18,2) DEFAULT 0;
ALTER TABLE "PurchaseRequisition" ADD COLUMN IF NOT EXISTS "budgetId" TEXT;
ALTER TABLE "PurchaseRequisition" ADD COLUMN IF NOT EXISTS "neededBy" TIMESTAMP;
ALTER TABLE "PurchaseRequisition" ADD COLUMN IF NOT EXISTS "currentApprovalStep" INTEGER DEFAULT 0;
ALTER TABLE "PurchaseRequisition" ADD COLUMN IF NOT EXISTS "totalApprovalSteps" INTEGER DEFAULT 0;
ALTER TABLE "PurchaseRequisition" ADD COLUMN IF NOT EXISTS "submittedAt" TIMESTAMP;
ALTER TABLE "PurchaseRequisition" ADD COLUMN IF NOT EXISTS "approvedAt" TIMESTAMP;
ALTER TABLE "PurchaseRequisition" ADD COLUMN IF NOT EXISTS "rejectedAt" TIMESTAMP;
ALTER TABLE "PurchaseRequisition" ADD COLUMN IF NOT EXISTS "rejectionReason" TEXT;
ALTER TABLE "PurchaseRequisition" ADD COLUMN IF NOT EXISTS "convertedToPOId" TEXT;
ALTER TABLE "PurchaseRequisition" ADD COLUMN IF NOT EXISTS "isEmergency" BOOLEAN DEFAULT FALSE;
ALTER TABLE "PurchaseRequisition" ADD COLUMN IF NOT EXISTS "isRecurring" BOOLEAN DEFAULT FALSE;
ALTER TABLE "PurchaseRequisition" ADD COLUMN IF NOT EXISTS "recurrenceRule" TEXT;
ALTER TABLE "PurchaseRequisition" ADD COLUMN IF NOT EXISTS "notes" TEXT;
ALTER TABLE "PurchaseRequisition" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP DEFAULT NOW();

ALTER TABLE "RFQ" ADD COLUMN IF NOT EXISTS "rfqNumber" TEXT;
ALTER TABLE "RFQ" ADD COLUMN IF NOT EXISTS "description" TEXT;
ALTER TABLE "RFQ" ADD COLUMN IF NOT EXISTS "type" TEXT DEFAULT 'RFQ';
ALTER TABLE "RFQ" ADD COLUMN IF NOT EXISTS "category" TEXT;
ALTER TABLE "RFQ" ADD COLUMN IF NOT EXISTS "requisitionId" TEXT;
ALTER TABLE "RFQ" ADD COLUMN IF NOT EXISTS "currency" TEXT DEFAULT 'KES';
ALTER TABLE "RFQ" ADD COLUMN IF NOT EXISTS "issueDate" TIMESTAMP;
ALTER TABLE "RFQ" ADD COLUMN IF NOT EXISTS "closingDate" TIMESTAMP;
ALTER TABLE "RFQ" ADD COLUMN IF NOT EXISTS "deliveryDate" TIMESTAMP;
ALTER TABLE "RFQ" ADD COLUMN IF NOT EXISTS "deliveryLocation" TEXT;
ALTER TABLE "RFQ" ADD COLUMN IF NOT EXISTS "paymentTerms" TEXT;
ALTER TABLE "RFQ" ADD COLUMN IF NOT EXISTS "evaluationCriteria" JSONB;
ALTER TABLE "RFQ" ADD COLUMN IF NOT EXISTS "createdBy" TEXT;
ALTER TABLE "RFQ" ADD COLUMN IF NOT EXISTS "createdByName" TEXT;
ALTER TABLE "RFQ" ADD COLUMN IF NOT EXISTS "publishedAt" TIMESTAMP;
ALTER TABLE "RFQ" ADD COLUMN IF NOT EXISTS "awardedAt" TIMESTAMP;
ALTER TABLE "RFQ" ADD COLUMN IF NOT EXISTS "awardedBidId" TEXT;
ALTER TABLE "RFQ" ADD COLUMN IF NOT EXISTS "notes" TEXT;
ALTER TABLE "RFQ" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP DEFAULT NOW();

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

ALTER TABLE "SupplierQuote" ADD COLUMN IF NOT EXISTS "supplierId" TEXT;
ALTER TABLE "SupplierQuote" ADD COLUMN IF NOT EXISTS "rfqId" TEXT;
ALTER TABLE "SupplierQuote" ADD COLUMN IF NOT EXISTS "number" TEXT;
ALTER TABLE "SupplierQuote" ADD COLUMN IF NOT EXISTS "currency" TEXT DEFAULT 'KES';
ALTER TABLE "SupplierQuote" ADD COLUMN IF NOT EXISTS "notes" TEXT;
ALTER TABLE "SupplierQuote" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP DEFAULT NOW();

COMMIT;

-- ##########################################################################
-- PART 2 — Create new procurement tables
-- ##########################################################################
BEGIN;

CREATE TABLE IF NOT EXISTS "SupplierContact" (
  "id" TEXT PRIMARY KEY,
  "organizationId" TEXT NOT NULL,
  "supplierId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "role" TEXT,
  "email" TEXT,
  "phone" TEXT,
  "isPrimary" BOOLEAN DEFAULT FALSE,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "SupplierContact_organizationId_idx" ON "SupplierContact"("organizationId");
CREATE INDEX IF NOT EXISTS "SupplierContact_supplierId_idx" ON "SupplierContact"("supplierId");

CREATE TABLE IF NOT EXISTS "SupplierBankAccount" (
  "id" TEXT PRIMARY KEY,
  "organizationId" TEXT NOT NULL,
  "supplierId" TEXT NOT NULL,
  "bankName" TEXT NOT NULL,
  "accountName" TEXT NOT NULL,
  "accountNumber" TEXT NOT NULL,
  "branchCode" TEXT,
  "swiftCode" TEXT,
  "currency" TEXT DEFAULT 'KES',
  "isPrimary" BOOLEAN DEFAULT FALSE,
  "isVerified" BOOLEAN DEFAULT FALSE,
  "verifiedAt" TIMESTAMP,
  "verifiedBy" TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "SupplierBankAccount_organizationId_idx" ON "SupplierBankAccount"("organizationId");
CREATE INDEX IF NOT EXISTS "SupplierBankAccount_supplierId_idx" ON "SupplierBankAccount"("supplierId");

CREATE TABLE IF NOT EXISTS "SupplierDocument" (
  "id" TEXT PRIMARY KEY,
  "organizationId" TEXT NOT NULL,
  "supplierId" TEXT NOT NULL,
  "documentType" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "fileUrl" TEXT NOT NULL,
  "fileSize" INTEGER,
  "mimeType" TEXT,
  "issueDate" TIMESTAMP,
  "expiryDate" TIMESTAMP,
  "status" TEXT DEFAULT 'PENDING',
  "verifiedAt" TIMESTAMP,
  "verifiedBy" TEXT,
  "notes" TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "SupplierDocument_organizationId_idx" ON "SupplierDocument"("organizationId");
CREATE INDEX IF NOT EXISTS "SupplierDocument_supplierId_idx" ON "SupplierDocument"("supplierId");
CREATE INDEX IF NOT EXISTS "SupplierDocument_expiryDate_idx" ON "SupplierDocument"("expiryDate");

CREATE TABLE IF NOT EXISTS "SupplierQualification" (
  "id" TEXT PRIMARY KEY,
  "organizationId" TEXT NOT NULL,
  "supplierId" TEXT NOT NULL,
  "qualificationType" TEXT NOT NULL,
  "status" TEXT DEFAULT 'PENDING',
  "score" INTEGER DEFAULT 0,
  "validFrom" TIMESTAMP,
  "validUntil" TIMESTAMP,
  "assessedBy" TEXT,
  "assessedAt" TIMESTAMP,
  "notes" TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "SupplierQualification_organizationId_idx" ON "SupplierQualification"("organizationId");
CREATE INDEX IF NOT EXISTS "SupplierQualification_supplierId_idx" ON "SupplierQualification"("supplierId");

CREATE TABLE IF NOT EXISTS "SupplierScorecard" (
  "id" TEXT PRIMARY KEY,
  "organizationId" TEXT NOT NULL,
  "supplierId" TEXT NOT NULL,
  "periodStart" TIMESTAMP NOT NULL,
  "periodEnd" TIMESTAMP NOT NULL,
  "deliveryScore" INTEGER DEFAULT 0,
  "qualityScore" INTEGER DEFAULT 0,
  "priceScore" INTEGER DEFAULT 0,
  "responsivenessScore" INTEGER DEFAULT 0,
  "complianceScore" INTEGER DEFAULT 0,
  "overallScore" INTEGER DEFAULT 0,
  "onTimeDeliveryPct" NUMERIC(5,2),
  "fillRatePct" NUMERIC(5,2),
  "defectRatePct" NUMERIC(5,2),
  "notes" TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "SupplierScorecard_organizationId_idx" ON "SupplierScorecard"("organizationId");
CREATE INDEX IF NOT EXISTS "SupplierScorecard_supplier_period_idx" ON "SupplierScorecard"("supplierId","periodStart");

CREATE TABLE IF NOT EXISTS "SupplierRisk" (
  "id" TEXT PRIMARY KEY,
  "organizationId" TEXT NOT NULL,
  "supplierId" TEXT NOT NULL,
  "riskType" TEXT NOT NULL,
  "severity" TEXT DEFAULT 'LOW',
  "title" TEXT NOT NULL,
  "description" TEXT,
  "detectedAt" TIMESTAMP DEFAULT NOW(),
  "detectedBy" TEXT DEFAULT 'SYSTEM',
  "status" TEXT DEFAULT 'OPEN',
  "resolvedAt" TIMESTAMP,
  "resolvedBy" TEXT,
  "resolution" TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "SupplierRisk_organizationId_idx" ON "SupplierRisk"("organizationId");
CREATE INDEX IF NOT EXISTS "SupplierRisk_supplierId_idx" ON "SupplierRisk"("supplierId");
CREATE INDEX IF NOT EXISTS "SupplierRisk_org_status_idx" ON "SupplierRisk"("organizationId","status");

CREATE TABLE IF NOT EXISTS "PurchaseRequisitionLine" (
  "id" TEXT PRIMARY KEY,
  "organizationId" TEXT NOT NULL,
  "requisitionId" TEXT NOT NULL,
  "lineNumber" INTEGER NOT NULL,
  "description" TEXT NOT NULL,
  "productId" TEXT,
  "category" TEXT,
  "quantity" NUMERIC(18,3) NOT NULL,
  "unitOfMeasure" TEXT DEFAULT 'UNIT',
  "unitPrice" NUMERIC(18,2) DEFAULT 0,
  "taxRate" NUMERIC(5,2) DEFAULT 0,
  "lineTotal" NUMERIC(18,2) DEFAULT 0,
  "specifications" TEXT,
  "preferredSupplierId" TEXT,
  "notes" TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "PurchaseRequisitionLine_organizationId_idx" ON "PurchaseRequisitionLine"("organizationId");
CREATE INDEX IF NOT EXISTS "PurchaseRequisitionLine_requisitionId_idx" ON "PurchaseRequisitionLine"("requisitionId");

CREATE TABLE IF NOT EXISTS "PurchaseRequisitionApproval" (
  "id" TEXT PRIMARY KEY,
  "organizationId" TEXT NOT NULL,
  "requisitionId" TEXT NOT NULL,
  "stepNumber" INTEGER NOT NULL,
  "approverId" TEXT NOT NULL,
  "approverRole" TEXT,
  "status" TEXT DEFAULT 'PENDING',
  "decision" TEXT,
  "comment" TEXT,
  "decidedAt" TIMESTAMP,
  "dueAt" TIMESTAMP,
  "slaHours" INTEGER DEFAULT 48,
  "delegatedTo" TEXT,
  "delegatedAt" TIMESTAMP,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "PurchaseRequisitionApproval_organizationId_idx" ON "PurchaseRequisitionApproval"("organizationId");
CREATE INDEX IF NOT EXISTS "PRA_requisition_step_idx" ON "PurchaseRequisitionApproval"("requisitionId","stepNumber");
CREATE INDEX IF NOT EXISTS "PRA_approver_status_idx" ON "PurchaseRequisitionApproval"("organizationId","approverId","status");

CREATE TABLE IF NOT EXISTS "RFQLine" (
  "id" TEXT PRIMARY KEY,
  "organizationId" TEXT NOT NULL,
  "rfqId" TEXT NOT NULL,
  "lineNumber" INTEGER NOT NULL,
  "description" TEXT NOT NULL,
  "productId" TEXT,
  "quantity" NUMERIC(18,3) NOT NULL,
  "unitOfMeasure" TEXT DEFAULT 'UNIT',
  "specifications" TEXT,
  "targetPrice" NUMERIC(18,2),
  "notes" TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "RFQLine_organizationId_idx" ON "RFQLine"("organizationId");
CREATE INDEX IF NOT EXISTS "RFQLine_rfqId_idx" ON "RFQLine"("rfqId");

CREATE TABLE IF NOT EXISTS "RFQSupplier" (
  "id" TEXT PRIMARY KEY,
  "organizationId" TEXT NOT NULL,
  "rfqId" TEXT NOT NULL,
  "supplierId" TEXT NOT NULL,
  "invitedAt" TIMESTAMP DEFAULT NOW(),
  "invitedBy" TEXT,
  "status" TEXT DEFAULT 'INVITED',
  "respondedAt" TIMESTAMP,
  "declineReason" TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW(),
  UNIQUE ("rfqId","supplierId")
);
CREATE INDEX IF NOT EXISTS "RFQSupplier_organizationId_idx" ON "RFQSupplier"("organizationId");
CREATE INDEX IF NOT EXISTS "RFQSupplier_supplierId_idx" ON "RFQSupplier"("supplierId");

CREATE TABLE IF NOT EXISTS "Bid" (
  "id" TEXT PRIMARY KEY,
  "organizationId" TEXT NOT NULL,
  "bidNumber" TEXT NOT NULL,
  "rfqId" TEXT,
  "supplierId" TEXT NOT NULL,
  "version" INTEGER DEFAULT 1,
  "status" TEXT DEFAULT 'DRAFT',
  "currency" TEXT DEFAULT 'KES',
  "subtotal" NUMERIC(18,2) DEFAULT 0,
  "taxAmount" NUMERIC(18,2) DEFAULT 0,
  "discount" NUMERIC(18,2) DEFAULT 0,
  "totalAmount" NUMERIC(18,2) DEFAULT 0,
  "deliveryDays" INTEGER,
  "warrantyMonths" INTEGER,
  "validityDays" INTEGER,
  "paymentTerms" TEXT,
  "technicalScore" INTEGER,
  "commercialScore" INTEGER,
  "overallScore" INTEGER,
  "evaluationNotes" TEXT,
  "submittedAt" TIMESTAMP,
  "evaluatedAt" TIMESTAMP,
  "evaluatedBy" TEXT,
  "isAwarded" BOOLEAN DEFAULT FALSE,
  "awardedAt" TIMESTAMP,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "Bid_organizationId_idx" ON "Bid"("organizationId");
CREATE INDEX IF NOT EXISTS "Bid_org_rfq_idx" ON "Bid"("organizationId","rfqId");
CREATE INDEX IF NOT EXISTS "Bid_org_supplier_idx" ON "Bid"("organizationId","supplierId");

CREATE TABLE IF NOT EXISTS "BidLine" (
  "id" TEXT PRIMARY KEY,
  "organizationId" TEXT NOT NULL,
  "bidId" TEXT NOT NULL,
  "rfqLineId" TEXT,
  "lineNumber" INTEGER NOT NULL,
  "description" TEXT NOT NULL,
  "quantity" NUMERIC(18,3) NOT NULL,
  "unitPrice" NUMERIC(18,2) NOT NULL,
  "taxRate" NUMERIC(5,2) DEFAULT 0,
  "lineTotal" NUMERIC(18,2) DEFAULT 0,
  "deliveryDays" INTEGER,
  "notes" TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "BidLine_organizationId_idx" ON "BidLine"("organizationId");
CREATE INDEX IF NOT EXISTS "BidLine_bidId_idx" ON "BidLine"("bidId");

CREATE TABLE IF NOT EXISTS "BidEvaluation" (
  "id" TEXT PRIMARY KEY,
  "organizationId" TEXT NOT NULL,
  "bidId" TEXT NOT NULL,
  "criterion" TEXT NOT NULL,
  "weight" NUMERIC(5,2) NOT NULL,
  "score" NUMERIC(5,2) NOT NULL,
  "weightedScore" NUMERIC(8,2) NOT NULL,
  "comment" TEXT,
  "evaluatedBy" TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "BidEvaluation_organizationId_idx" ON "BidEvaluation"("organizationId");
CREATE INDEX IF NOT EXISTS "BidEvaluation_bidId_idx" ON "BidEvaluation"("bidId");

CREATE TABLE IF NOT EXISTS "BidAward" (
  "id" TEXT PRIMARY KEY,
  "organizationId" TEXT NOT NULL,
  "rfqId" TEXT,
  "bidId" TEXT NOT NULL,
  "supplierId" TEXT NOT NULL,
  "awardedBy" TEXT NOT NULL,
  "awardedAt" TIMESTAMP DEFAULT NOW(),
  "justification" TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "BidAward_organizationId_idx" ON "BidAward"("organizationId");
CREATE INDEX IF NOT EXISTS "BidAward_bidId_idx" ON "BidAward"("bidId");

CREATE TABLE IF NOT EXISTS "Auction" (
  "id" TEXT PRIMARY KEY,
  "organizationId" TEXT NOT NULL,
  "auctionNumber" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "status" TEXT DEFAULT 'DRAFT',
  "currency" TEXT DEFAULT 'KES',
  "startingPrice" NUMERIC(18,2) NOT NULL,
  "minDecrement" NUMERIC(18,2) NOT NULL,
  "currentPrice" NUMERIC(18,2),
  "reservePrice" NUMERIC(18,2),
  "startAt" TIMESTAMP,
  "endAt" TIMESTAMP,
  "isAnonymous" BOOLEAN DEFAULT FALSE,
  "isSealed" BOOLEAN DEFAULT FALSE,
  "createdBy" TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "Auction_organizationId_idx" ON "Auction"("organizationId");
CREATE INDEX IF NOT EXISTS "Auction_org_status_idx" ON "Auction"("organizationId","status");

CREATE TABLE IF NOT EXISTS "AuctionBid" (
  "id" TEXT PRIMARY KEY,
  "organizationId" TEXT NOT NULL,
  "auctionId" TEXT NOT NULL,
  "supplierId" TEXT NOT NULL,
  "amount" NUMERIC(18,2) NOT NULL,
  "currency" TEXT DEFAULT 'KES',
  "isWinning" BOOLEAN DEFAULT FALSE,
  "placedAt" TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "AuctionBid_organizationId_idx" ON "AuctionBid"("organizationId");
CREATE INDEX IF NOT EXISTS "AuctionBid_auctionId_idx" ON "AuctionBid"("auctionId");
CREATE INDEX IF NOT EXISTS "AuctionBid_auction_amount_idx" ON "AuctionBid"("auctionId","amount");

CREATE TABLE IF NOT EXISTS "Contract" (
  "id" TEXT PRIMARY KEY,
  "organizationId" TEXT NOT NULL,
  "contractNumber" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "type" TEXT DEFAULT 'SUPPLY',
  "status" TEXT DEFAULT 'DRAFT',
  "supplierId" TEXT NOT NULL,
  "rfqId" TEXT,
  "purchaseOrderId" TEXT,
  "currency" TEXT DEFAULT 'KES',
  "value" NUMERIC(18,2) DEFAULT 0,
  "startDate" TIMESTAMP,
  "endDate" TIMESTAMP,
  "signedDate" TIMESTAMP,
  "signedBy" TEXT,
  "signedBySupplier" TEXT,
  "autoRenew" BOOLEAN DEFAULT FALSE,
  "renewalNoticeDays" INTEGER DEFAULT 30,
  "documentUrl" TEXT,
  "terms" TEXT,
  "slaTerms" TEXT,
  "penalties" TEXT,
  "notes" TEXT,
  "createdBy" TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "Contract_organizationId_idx" ON "Contract"("organizationId");
CREATE INDEX IF NOT EXISTS "Contract_org_status_idx" ON "Contract"("organizationId","status");
CREATE INDEX IF NOT EXISTS "Contract_org_supplier_idx" ON "Contract"("organizationId","supplierId");
CREATE INDEX IF NOT EXISTS "Contract_endDate_idx" ON "Contract"("endDate");

CREATE TABLE IF NOT EXISTS "ContractLine" (
  "id" TEXT PRIMARY KEY,
  "organizationId" TEXT NOT NULL,
  "contractId" TEXT NOT NULL,
  "lineNumber" INTEGER NOT NULL,
  "description" TEXT NOT NULL,
  "productId" TEXT,
  "quantity" NUMERIC(18,3),
  "unitPrice" NUMERIC(18,2),
  "unitOfMeasure" TEXT DEFAULT 'UNIT',
  "discountPct" NUMERIC(5,2),
  "notes" TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "ContractLine_organizationId_idx" ON "ContractLine"("organizationId");
CREATE INDEX IF NOT EXISTS "ContractLine_contractId_idx" ON "ContractLine"("contractId");

CREATE TABLE IF NOT EXISTS "ContractMilestone" (
  "id" TEXT PRIMARY KEY,
  "organizationId" TEXT NOT NULL,
  "contractId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "dueDate" TIMESTAMP NOT NULL,
  "completedAt" TIMESTAMP,
  "status" TEXT DEFAULT 'PENDING',
  "amount" NUMERIC(18,2),
  "notes" TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "ContractMilestone_organizationId_idx" ON "ContractMilestone"("organizationId");
CREATE INDEX IF NOT EXISTS "ContractMilestone_contractId_idx" ON "ContractMilestone"("contractId");

CREATE TABLE IF NOT EXISTS "GoodsReceiptLine" (
  "id" TEXT PRIMARY KEY,
  "organizationId" TEXT NOT NULL,
  "goodsReceiptId" TEXT NOT NULL,
  "poLineId" TEXT,
  "lineNumber" INTEGER NOT NULL,
  "description" TEXT NOT NULL,
  "productId" TEXT,
  "orderedQty" NUMERIC(18,3) NOT NULL,
  "receivedQty" NUMERIC(18,3) NOT NULL,
  "rejectedQty" NUMERIC(18,3) DEFAULT 0,
  "damagedQty" NUMERIC(18,3) DEFAULT 0,
  "unitPrice" NUMERIC(18,2) NOT NULL,
  "lineTotal" NUMERIC(18,2) DEFAULT 0,
  "serialNumbers" TEXT,
  "batchNumber" TEXT,
  "lotNumber" TEXT,
  "expiryDate" TIMESTAMP,
  "condition" TEXT DEFAULT 'GOOD',
  "notes" TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "GoodsReceiptLine_organizationId_idx" ON "GoodsReceiptLine"("organizationId");
CREATE INDEX IF NOT EXISTS "GoodsReceiptLine_goodsReceiptId_idx" ON "GoodsReceiptLine"("goodsReceiptId");

CREATE TABLE IF NOT EXISTS "QualityInspection" (
  "id" TEXT PRIMARY KEY,
  "organizationId" TEXT NOT NULL,
  "goodsReceiptId" TEXT,
  "purchaseOrderId" TEXT,
  "inspectorId" TEXT,
  "inspectorName" TEXT,
  "status" TEXT DEFAULT 'PENDING',
  "inspectedAt" TIMESTAMP,
  "sampleSize" INTEGER,
  "passedQty" NUMERIC(18,3),
  "failedQty" NUMERIC(18,3),
  "findings" TEXT,
  "correctiveAction" TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "QualityInspection_organizationId_idx" ON "QualityInspection"("organizationId");
CREATE INDEX IF NOT EXISTS "QualityInspection_org_status_idx" ON "QualityInspection"("organizationId","status");

CREATE TABLE IF NOT EXISTS "ThreeWayMatch" (
  "id" TEXT PRIMARY KEY,
  "organizationId" TEXT NOT NULL,
  "purchaseOrderId" TEXT NOT NULL,
  "goodsReceiptId" TEXT,
  "supplierInvoiceId" TEXT,
  "invoiceNumber" TEXT,
  "invoiceDate" TIMESTAMP,
  "invoiceAmount" NUMERIC(18,2) NOT NULL,
  "poAmount" NUMERIC(18,2) NOT NULL,
  "receivedAmount" NUMERIC(18,2) NOT NULL,
  "varianceAmount" NUMERIC(18,2) DEFAULT 0,
  "variancePct" NUMERIC(8,2) DEFAULT 0,
  "status" TEXT DEFAULT 'PENDING',
  "matchType" TEXT DEFAULT 'THREE_WAY',
  "matchedAt" TIMESTAMP,
  "matchedBy" TEXT,
  "exceptionId" TEXT,
  "notes" TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "ThreeWayMatch_organizationId_idx" ON "ThreeWayMatch"("organizationId");
CREATE INDEX IF NOT EXISTS "ThreeWayMatch_org_status_idx" ON "ThreeWayMatch"("organizationId","status");
CREATE INDEX IF NOT EXISTS "ThreeWayMatch_org_po_idx" ON "ThreeWayMatch"("organizationId","purchaseOrderId");

CREATE TABLE IF NOT EXISTS "ProcurementException" (
  "id" TEXT PRIMARY KEY,
  "organizationId" TEXT NOT NULL,
  "exceptionType" TEXT NOT NULL,
  "severity" TEXT DEFAULT 'MEDIUM',
  "referenceType" TEXT,
  "referenceId" TEXT,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "status" TEXT DEFAULT 'OPEN',
  "detectedAt" TIMESTAMP DEFAULT NOW(),
  "detectedBy" TEXT DEFAULT 'SYSTEM',
  "resolvedAt" TIMESTAMP,
  "resolvedBy" TEXT,
  "resolution" TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "ProcurementException_organizationId_idx" ON "ProcurementException"("organizationId");
CREATE INDEX IF NOT EXISTS "ProcurementException_org_status_idx" ON "ProcurementException"("organizationId","status");
CREATE INDEX IF NOT EXISTS "ProcurementException_org_type_idx" ON "ProcurementException"("organizationId","exceptionType");

CREATE TABLE IF NOT EXISTS "LandedCost" (
  "id" TEXT PRIMARY KEY,
  "organizationId" TEXT NOT NULL,
  "purchaseOrderId" TEXT NOT NULL,
  "currency" TEXT DEFAULT 'KES',
  "purchasePrice" NUMERIC(18,2) DEFAULT 0,
  "freight" NUMERIC(18,2) DEFAULT 0,
  "insurance" NUMERIC(18,2) DEFAULT 0,
  "customsDuty" NUMERIC(18,2) DEFAULT 0,
  "taxes" NUMERIC(18,2) DEFAULT 0,
  "handling" NUMERIC(18,2) DEFAULT 0,
  "otherCharges" NUMERIC(18,2) DEFAULT 0,
  "totalLandedCost" NUMERIC(18,2) DEFAULT 0,
  "incoterms" TEXT,
  "notes" TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "LandedCost_organizationId_idx" ON "LandedCost"("organizationId");
CREATE INDEX IF NOT EXISTS "LandedCost_org_po_idx" ON "LandedCost"("organizationId","purchaseOrderId");

CREATE TABLE IF NOT EXISTS "SpendCategory" (
  "id" TEXT PRIMARY KEY,
  "organizationId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "code" TEXT,
  "parentId" TEXT,
  "description" TEXT,
  "isActive" BOOLEAN DEFAULT TRUE,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "SpendCategory_organizationId_idx" ON "SpendCategory"("organizationId");
CREATE INDEX IF NOT EXISTS "SpendCategory_org_parent_idx" ON "SpendCategory"("organizationId","parentId");

CREATE TABLE IF NOT EXISTS "SpendAnalysis" (
  "id" TEXT PRIMARY KEY,
  "organizationId" TEXT NOT NULL,
  "periodStart" TIMESTAMP NOT NULL,
  "periodEnd" TIMESTAMP NOT NULL,
  "categoryId" TEXT,
  "supplierId" TEXT,
  "departmentId" TEXT,
  "projectId" TEXT,
  "costCenter" TEXT,
  "currency" TEXT DEFAULT 'KES',
  "amount" NUMERIC(18,2) DEFAULT 0,
  "isContracted" BOOLEAN DEFAULT FALSE,
  "isMaverick" BOOLEAN DEFAULT FALSE,
  "notes" TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "SpendAnalysis_organizationId_idx" ON "SpendAnalysis"("organizationId");
CREATE INDEX IF NOT EXISTS "SpendAnalysis_org_period_idx" ON "SpendAnalysis"("organizationId","periodStart");
CREATE INDEX IF NOT EXISTS "SpendAnalysis_org_supplier_idx" ON "SpendAnalysis"("organizationId","supplierId");

CREATE TABLE IF NOT EXISTS "ProcurementBudget" (
  "id" TEXT PRIMARY KEY,
  "organizationId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "fiscalYear" TEXT,
  "departmentId" TEXT,
  "categoryId" TEXT,
  "costCenter" TEXT,
  "currency" TEXT DEFAULT 'KES',
  "budgetAmount" NUMERIC(18,2) DEFAULT 0,
  "committedAmount" NUMERIC(18,2) DEFAULT 0,
  "actualAmount" NUMERIC(18,2) DEFAULT 0,
  "availableAmount" NUMERIC(18,2) DEFAULT 0,
  "periodStart" TIMESTAMP,
  "periodEnd" TIMESTAMP,
  "status" TEXT DEFAULT 'ACTIVE',
  "notes" TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "ProcurementBudget_organizationId_idx" ON "ProcurementBudget"("organizationId");
CREATE INDEX IF NOT EXISTS "ProcurementBudget_org_fy_idx" ON "ProcurementBudget"("organizationId","fiscalYear");

CREATE TABLE IF NOT EXISTS "ProcurementCommitment" (
  "id" TEXT PRIMARY KEY,
  "organizationId" TEXT NOT NULL,
  "budgetId" TEXT,
  "purchaseOrderId" TEXT,
  "requisitionId" TEXT,
  "amount" NUMERIC(18,2) NOT NULL,
  "currency" TEXT DEFAULT 'KES',
  "status" TEXT DEFAULT 'ACTIVE',
  "committedAt" TIMESTAMP DEFAULT NOW(),
  "releasedAt" TIMESTAMP,
  "notes" TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "ProcurementCommitment_organizationId_idx" ON "ProcurementCommitment"("organizationId");
CREATE INDEX IF NOT EXISTS "ProcurementCommitment_org_budget_idx" ON "ProcurementCommitment"("organizationId","budgetId");

CREATE TABLE IF NOT EXISTS "ProcurementWorkflow" (
  "id" TEXT PRIMARY KEY,
  "organizationId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "triggerEvent" TEXT NOT NULL,
  "conditions" JSONB,
  "actions" JSONB,
  "isActive" BOOLEAN DEFAULT TRUE,
  "priority" INTEGER DEFAULT 0,
  "createdBy" TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "ProcurementWorkflow_organizationId_idx" ON "ProcurementWorkflow"("organizationId");
CREATE INDEX IF NOT EXISTS "ProcurementWorkflow_org_trigger_idx" ON "ProcurementWorkflow"("organizationId","triggerEvent");

CREATE TABLE IF NOT EXISTS "ProcurementApprovalRule" (
  "id" TEXT PRIMARY KEY,
  "organizationId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "appliesTo" TEXT DEFAULT 'REQUISITION',
  "minAmount" NUMERIC(18,2) DEFAULT 0,
  "maxAmount" NUMERIC(18,2),
  "category" TEXT,
  "departmentId" TEXT,
  "location" TEXT,
  "currency" TEXT DEFAULT 'KES',
  "approverRole" TEXT NOT NULL,
  "approverUserId" TEXT,
  "stepNumber" INTEGER DEFAULT 1,
  "isRequired" BOOLEAN DEFAULT TRUE,
  "slaHours" INTEGER DEFAULT 48,
  "isActive" BOOLEAN DEFAULT TRUE,
  "createdBy" TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "ProcurementApprovalRule_organizationId_idx" ON "ProcurementApprovalRule"("organizationId");
CREATE INDEX IF NOT EXISTS "PAR_org_appliesTo_idx" ON "ProcurementApprovalRule"("organizationId","appliesTo");
CREATE INDEX IF NOT EXISTS "PAR_org_amount_idx" ON "ProcurementApprovalRule"("organizationId","minAmount","maxAmount");

CREATE TABLE IF NOT EXISTS "ProcurementApproval" (
  "id" TEXT PRIMARY KEY,
  "organizationId" TEXT NOT NULL,
  "entityType" TEXT NOT NULL,
  "entityId" TEXT NOT NULL,
  "stepNumber" INTEGER NOT NULL,
  "approverId" TEXT NOT NULL,
  "approverRole" TEXT,
  "status" TEXT DEFAULT 'PENDING',
  "decision" TEXT,
  "comment" TEXT,
  "decidedAt" TIMESTAMP,
  "dueAt" TIMESTAMP,
  "delegatedTo" TEXT,
  "delegatedAt" TIMESTAMP,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "ProcurementApproval_organizationId_idx" ON "ProcurementApproval"("organizationId");
CREATE INDEX IF NOT EXISTS "PA_entity_idx" ON "ProcurementApproval"("organizationId","entityType","entityId");
CREATE INDEX IF NOT EXISTS "PA_approver_status_idx" ON "ProcurementApproval"("organizationId","approverId","status");

CREATE TABLE IF NOT EXISTS "ProcurementEvent" (
  "id" TEXT PRIMARY KEY,
  "organizationId" TEXT NOT NULL,
  "eventType" TEXT NOT NULL,
  "entityType" TEXT,
  "entityId" TEXT,
  "actorId" TEXT,
  "actorName" TEXT,
  "summary" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "ProcurementEvent_organizationId_idx" ON "ProcurementEvent"("organizationId");
CREATE INDEX IF NOT EXISTS "ProcurementEvent_org_type_idx" ON "ProcurementEvent"("organizationId","eventType");
CREATE INDEX IF NOT EXISTS "ProcurementEvent_org_created_idx" ON "ProcurementEvent"("organizationId","createdAt");

CREATE TABLE IF NOT EXISTS "ProcurementAuditLog" (
  "id" TEXT PRIMARY KEY,
  "organizationId" TEXT NOT NULL,
  "entityType" TEXT NOT NULL,
  "entityId" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "fieldName" TEXT,
  "oldValue" TEXT,
  "newValue" TEXT,
  "actorId" TEXT,
  "actorName" TEXT,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "ProcurementAuditLog_organizationId_idx" ON "ProcurementAuditLog"("organizationId");
CREATE INDEX IF NOT EXISTS "PAL_entity_idx" ON "ProcurementAuditLog"("organizationId","entityType","entityId");
CREATE INDEX IF NOT EXISTS "PAL_org_created_idx" ON "ProcurementAuditLog"("organizationId","createdAt");

COMMIT;

-- ##########################################################################
-- PART 3 — Add foreign keys (each wrapped in its own DO block)
-- ##########################################################################
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'SupplierContact_supplierId_fkey') THEN
    ALTER TABLE "SupplierContact" ADD CONSTRAINT "SupplierContact_supplierId_fkey"
      FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'SupplierBankAccount_supplierId_fkey') THEN
    ALTER TABLE "SupplierBankAccount" ADD CONSTRAINT "SupplierBankAccount_supplierId_fkey"
      FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'SupplierDocument_supplierId_fkey') THEN
    ALTER TABLE "SupplierDocument" ADD CONSTRAINT "SupplierDocument_supplierId_fkey"
      FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'SupplierQualification_supplierId_fkey') THEN
    ALTER TABLE "SupplierQualification" ADD CONSTRAINT "SupplierQualification_supplierId_fkey"
      FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'SupplierScorecard_supplierId_fkey') THEN
    ALTER TABLE "SupplierScorecard" ADD CONSTRAINT "SupplierScorecard_supplierId_fkey"
      FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'SupplierRisk_supplierId_fkey') THEN
    ALTER TABLE "SupplierRisk" ADD CONSTRAINT "SupplierRisk_supplierId_fkey"
      FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'PurchaseOrder_supplierId_fkey') THEN
    ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_supplierId_fkey"
      FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'PurchaseOrderItem_purchaseOrderId_fkey') THEN
    ALTER TABLE "PurchaseOrderItem" ADD CONSTRAINT "PurchaseOrderItem_purchaseOrderId_fkey"
      FOREIGN KEY ("purchaseOrderId") REFERENCES "PurchaseOrder"("id") ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'SupplierQuote_supplierId_fkey') THEN
    ALTER TABLE "SupplierQuote" ADD CONSTRAINT "SupplierQuote_supplierId_fkey"
      FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'SupplierQuote_rfqId_fkey') THEN
    ALTER TABLE "SupplierQuote" ADD CONSTRAINT "SupplierQuote_rfqId_fkey"
      FOREIGN KEY ("rfqId") REFERENCES "RFQ"("id") ON DELETE SET NULL;
  END IF;
END $$;

-- ==========================================================================
-- END OF PROCUREMENT P0 SAFE MIGRATION V2
-- All statements idempotent. No destructive operations. Safe to re-run.
-- ==========================================================================