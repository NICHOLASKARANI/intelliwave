export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { assertProcurement, procurementHandler } from '@/lib/wavecore/procurement-guard'

/**
 * GET /api/wavecore/procurement/match/dashboard
 *
 * Read-only cross-document gap analysis across the procurement chain:
 *   PO -> GRN -> Supplier Invoice -> Payment Run
 *
 * Returns KPI counts and up to 50 rows per gap category.
 * Never writes anything. Never mutates state. Tenant-scoped.
 */
export const GET = procurementHandler(async (request: NextRequest) => {
  const g = await assertProcurement(request, 'READ')
  const orgId = g.organizationId

  const LIMIT = 50

  // ---- KPI counts (single round-trip each, all read-only) ----
  const [
    receivingGapsKpi,
    invoicingGapsKpi,
    noPoKpi,
    awaitingKpi,
    exceptionsKpi,
  ] = await Promise.all([
    // POs in active statuses that have zero GRNs
    pool.query(
      `SELECT COUNT(*)::int AS n
       FROM "PurchaseOrder" po
       WHERE po."organizationId" = $1
         AND po.status IN ('APPROVED','SENT','ACKNOWLEDGED','PARTIALLY_RECEIVED')
         AND NOT EXISTS (
           SELECT 1 FROM "GoodsReceipt" gr
           WHERE gr."purchaseOrderId" = po.id
             AND gr."organizationId" = $1
         )`,
      [orgId]
    ),
    // GRNs in closed/received statuses that have zero invoices referencing them
    pool.query(
      `SELECT COUNT(*)::int AS n
       FROM "GoodsReceipt" gr
       WHERE gr."organizationId" = $1
         AND gr.status IN ('RECEIVED','INSPECTED','COMPLETED')
         AND NOT EXISTS (
           SELECT 1 FROM "SupplierInvoice" si
           WHERE si."goodsReceiptId" = gr.id
             AND si."organizationId" = $1
         )`,
      [orgId]
    ),
    // Invoices with no PO (unmatched spend), excluding terminal statuses
    pool.query(
      `SELECT COUNT(*)::int AS n
       FROM "SupplierInvoice" si
       WHERE si."organizationId" = $1
         AND si."purchaseOrderId" IS NULL
         AND si.status NOT IN ('CANCELLED','PAID')`,
      [orgId]
    ),
    // Invoices in DRAFT/SUBMITTED that have not been matched yet
    pool.query(
      `SELECT COUNT(*)::int AS n
       FROM "SupplierInvoice" si
       WHERE si."organizationId" = $1
         AND si.status IN ('DRAFT','SUBMITTED')
         AND (si."matchStatus" IS NULL OR si."matchStatus" = 'UNMATCHED')`,
      [orgId]
    ),
    // Invoices flagged as exceptions or partial match
    pool.query(
      `SELECT COUNT(*)::int AS n
       FROM "SupplierInvoice" si
       WHERE si."organizationId" = $1
         AND (
           si."matchStatus" IN ('EXCEPTION','PARTIAL')
           OR si.status IN ('MISMATCH','PARTIAL_MATCH')
         )`,
      [orgId]
    ),
  ])

  // ---- Detail rows (each capped) ----
  const [
    receivingGaps,
    invoicingGaps,
    noPo,
    awaiting,
    exceptions,
  ] = await Promise.all([
    // POs with no GRN
    pool.query(
      `SELECT po.id, po.number AS "number", po.status, po.total, po.currency,
              po."supplierName" AS "supplierName", po."createdAt" AS "createdAt",
              po.date AS "poDate"
       FROM "PurchaseOrder" po
       WHERE po."organizationId" = $1
         AND po.status IN ('APPROVED','SENT','ACKNOWLEDGED','PARTIALLY_RECEIVED')
         AND NOT EXISTS (
           SELECT 1 FROM "GoodsReceipt" gr
           WHERE gr."purchaseOrderId" = po.id
             AND gr."organizationId" = $1
         )
       ORDER BY po."createdAt" ASC
       LIMIT ${LIMIT}`,
      [orgId]
    ),
    // GRNs with no invoice
    pool.query(
      `SELECT gr.id, gr."grnNumber" AS "grnNumber", gr.status,
              gr."receivedAt" AS "receivedAt", gr."createdAt" AS "createdAt",
              gr."totalReceived" AS "totalReceived", gr.currency,
              po.number AS "poNumber", po."supplierName" AS "supplierName"
       FROM "GoodsReceipt" gr
       LEFT JOIN "PurchaseOrder" po ON po.id = gr."purchaseOrderId"
       WHERE gr."organizationId" = $1
         AND gr.status IN ('RECEIVED','INSPECTED','COMPLETED')
         AND NOT EXISTS (
           SELECT 1 FROM "SupplierInvoice" si
           WHERE si."goodsReceiptId" = gr.id
             AND si."organizationId" = $1
         )
       ORDER BY gr."createdAt" ASC
       LIMIT ${LIMIT}`,
      [orgId]
    ),
    // Invoices with no PO
    pool.query(
      `SELECT si.id, si."invoiceNumber" AS "invoiceNumber", si.status,
              si."supplierInvoiceRef" AS "supplierInvoiceRef",
              si."supplierName" AS "supplierName",
              si.total, si.currency, si."invoiceDate" AS "invoiceDate",
              si."createdAt" AS "createdAt"
       FROM "SupplierInvoice" si
       WHERE si."organizationId" = $1
         AND si."purchaseOrderId" IS NULL
         AND si.status NOT IN ('CANCELLED','PAID')
       ORDER BY si."createdAt" ASC
       LIMIT ${LIMIT}`,
      [orgId]
    ),
    // Awaiting match
    pool.query(
      `SELECT si.id, si."invoiceNumber" AS "invoiceNumber", si.status,
              si."supplierName" AS "supplierName",
              si.total, si.currency, si."invoiceDate" AS "invoiceDate",
              si."createdAt" AS "createdAt", si."matchStatus" AS "matchStatus"
       FROM "SupplierInvoice" si
       WHERE si."organizationId" = $1
         AND si.status IN ('DRAFT','SUBMITTED')
         AND (si."matchStatus" IS NULL OR si."matchStatus" = 'UNMATCHED')
       ORDER BY si."createdAt" ASC
       LIMIT ${LIMIT}`,
      [orgId]
    ),
    // Match exceptions
    pool.query(
      `SELECT si.id, si."invoiceNumber" AS "invoiceNumber", si.status,
              si."supplierName" AS "supplierName",
              si.total, si.currency, si."invoiceDate" AS "invoiceDate",
              si."createdAt" AS "createdAt",
              si."matchStatus" AS "matchStatus",
              si."matchNotes" AS "matchNotes",
              po.number AS "poNumber"
       FROM "SupplierInvoice" si
       LEFT JOIN "PurchaseOrder" po ON po.id = si."purchaseOrderId"
       WHERE si."organizationId" = $1
         AND (
           si."matchStatus" IN ('EXCEPTION','PARTIAL')
           OR si.status IN ('MISMATCH','PARTIAL_MATCH')
         )
       ORDER BY si."createdAt" DESC
       LIMIT ${LIMIT}`,
      [orgId]
    ),
  ])

  return NextResponse.json({
    kpis: {
      receivingGaps: receivingGapsKpi.rows[0]?.n || 0,
      invoicingGaps: invoicingGapsKpi.rows[0]?.n || 0,
      noPo: noPoKpi.rows[0]?.n || 0,
      awaitingMatch: awaitingKpi.rows[0]?.n || 0,
      matchExceptions: exceptionsKpi.rows[0]?.n || 0,
    },
    receiving: receivingGaps.rows,
    invoicing: invoicingGaps.rows,
    noPo: noPo.rows,
    awaiting: awaiting.rows,
    exceptions: exceptions.rows,
    generatedAt: new Date().toISOString(),
  })
})