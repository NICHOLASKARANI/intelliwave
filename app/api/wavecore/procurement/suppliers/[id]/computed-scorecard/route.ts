export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { assertProcurement, procurementHandler } from '@/lib/wavecore/procurement-guard'

/**
 * GET /api/wavecore/procurement/suppliers/[id]/computed-scorecard
 *
 * Read-only. Computes a supplier performance scorecard from real
 * PO / GRN / Invoice data over the last N months (default 12).
 * Never writes anything. Tenant-scoped.
 *
 * On-time delivery is defined as: GRN.receivedAt within 30 days of
 * the linked PO.date. Adjust ON_TIME_WINDOW_DAYS here to change policy.
 */
const ON_TIME_WINDOW_DAYS = 30
const WINDOW_MONTHS = 12

const pct = (num: number, den: number): number | null => {
  if (!den) return null
  return Math.round((num / den) * 1000) / 10
}

export const GET = procurementHandler(async (request: NextRequest, ctx: { params: { id: string } }) => {
  const g = await assertProcurement(request, 'READ')
  const supplierId = ctx.params.id

  const owner = await pool.query(
    `SELECT id, name FROM "Supplier" WHERE id = $1 AND "organizationId" = $2`,
    [supplierId, g.organizationId]
  )
  if (owner.rowCount === 0) {
    return NextResponse.json({ error: 'Supplier not found' }, { status: 404 })
  }

  const now = new Date()
  const from = new Date(now.getFullYear(), now.getMonth() - WINDOW_MONTHS, 1)

  // ---- 1. PO aggregate + monthly spend ----
  const poAgg = await pool.query(
    `SELECT
        COUNT(*)::int                                        AS "poCount",
        COALESCE(SUM(total), 0)                              AS "poTotal",
        COALESCE(AVG(total), 0)                              AS "poAvg"
     FROM "PurchaseOrder"
     WHERE "organizationId" = $1
       AND "supplierId" = $2
       AND date >= $3`,
    [g.organizationId, supplierId, from]
  )

  const monthlySpend = await pool.query(
    `SELECT to_char(date_trunc('month', date), 'YYYY-MM') AS month,
            COALESCE(SUM(total), 0) AS spend,
            COUNT(*)::int AS "poCount"
     FROM "PurchaseOrder"
     WHERE "organizationId" = $1
       AND "supplierId" = $2
       AND date >= $3
     GROUP BY 1
     ORDER BY 1 ASC`,
    [g.organizationId, supplierId, from]
  )

  // ---- 2. Lead time: GRN.receivedAt - PO.date ----
  const leadTime = await pool.query(
    `SELECT
        COUNT(*)::int AS "sampleSize",
        COALESCE(AVG(EXTRACT(EPOCH FROM (gr."receivedAt" - po.date)) / 86400.0), 0) AS "avgDays",
        COUNT(*) FILTER (
          WHERE gr."receivedAt" IS NOT NULL
            AND EXTRACT(EPOCH FROM (gr."receivedAt" - po.date)) / 86400.0 <= $4
        )::int AS "onTimeCount"
     FROM "GoodsReceipt" gr
     JOIN "PurchaseOrder" po ON po.id = gr."purchaseOrderId"
     WHERE gr."organizationId" = $1
       AND po."supplierId" = $2
       AND gr."receivedAt" IS NOT NULL
       AND po.date >= $3`,
    [g.organizationId, supplierId, from, ON_TIME_WINDOW_DAYS]
  )

  // ---- 3. Rejection / damage rate from GRN lines ----
  const rejection = await pool.query(
    `SELECT
        COALESCE(SUM(grl."receivedQty"), 0)                       AS "received",
        COALESCE(SUM(grl."rejectedQty" + grl."damagedQty"), 0)    AS "rejected",
        COUNT(*)::int                                             AS "lineCount"
     FROM "GoodsReceiptLine" grl
     JOIN "GoodsReceipt" gr ON gr.id = grl."goodsReceiptId"
     JOIN "PurchaseOrder" po ON po.id = gr."purchaseOrderId"
     WHERE grl."organizationId" = $1
       AND po."supplierId" = $2
       AND gr."receivedAt" >= $3`,
    [g.organizationId, supplierId, from]
  )

  // ---- 4. Invoice accuracy: matched lines vs total lines ----
  const invoiceAgg = await pool.query(
    `SELECT
        COUNT(*)::int                                              AS "lineCount",
        COUNT(*) FILTER (WHERE sil."matchStatus" = 'AUTO_MATCHED')::int AS "matchedLines",
        COUNT(DISTINCT si.id)::int                                 AS "invoiceCount"
     FROM "SupplierInvoiceLine" sil
     JOIN "SupplierInvoice" si ON si.id = sil."supplierInvoiceId"
     WHERE sil."organizationId" = $1
       AND si."supplierId" = $2
       AND si."createdAt" >= $3`,
    [g.organizationId, supplierId, from]
  )

  // ---- 5. Price variance: invoice line unitPrice vs PO item unitPrice ----
  const priceVar = await pool.query(
    `SELECT
        COUNT(*)::int AS "sampleSize",
        COALESCE(
          AVG( (sil."unitPrice" - poi."unitPrice") / NULLIF(poi."unitPrice", 0) ) * 100,
          0
        ) AS "avgVariancePct"
     FROM "SupplierInvoiceLine" sil
     JOIN "SupplierInvoice" si ON si.id = sil."supplierInvoiceId"
     JOIN "PurchaseOrderItem" poi ON poi.id = sil."purchaseOrderItemId"
     WHERE sil."organizationId" = $1
       AND si."supplierId" = $2
       AND si."createdAt" >= $3
       AND poi."unitPrice" > 0`,
    [g.organizationId, supplierId, from]
  )

  // ---- 6. GRN count ----
  const grnAgg = await pool.query(
    `SELECT COUNT(*)::int AS "grnCount"
     FROM "GoodsReceipt" gr
     JOIN "PurchaseOrder" po ON po.id = gr."purchaseOrderId"
     WHERE gr."organizationId" = $1
       AND po."supplierId" = $2
       AND gr."createdAt" >= $3`,
    [g.organizationId, supplierId, from]
  )

  const poRow = poAgg.rows[0] || {}
  const ltRow = leadTime.rows[0] || {}
  const rejRow = rejection.rows[0] || {}
  const invRow = invoiceAgg.rows[0] || {}
  const pvRow = priceVar.rows[0] || {}
  const grnRow = grnAgg.rows[0] || {}

  const onTimePct = ltRow.sampleSize > 0 ? pct(ltRow.onTimeCount, ltRow.sampleSize) : null
  const invoiceAccPct = invRow.lineCount > 0 ? pct(invRow.matchedLines, invRow.lineCount) : null
  const rejRatePct = Number(rejRow.received) > 0
    ? Math.round((Number(rejRow.rejected) / Number(rejRow.received)) * 1000) / 10
    : null

  return NextResponse.json({
    supplier: { id: owner.rows[0].id, name: owner.rows[0].name },
    window: {
      months: WINDOW_MONTHS,
      fromISO: from.toISOString(),
      toISO: now.toISOString(),
      onTimeWindowDays: ON_TIME_WINDOW_DAYS,
    },

    onTimeDeliveryPct: onTimePct,
    onTimeSampleSize: ltRow.sampleSize || 0,

    avgLeadTimeDays: Math.round(Number(ltRow.avgDays || 0) * 10) / 10,
    leadTimeSampleSize: ltRow.sampleSize || 0,

    invoiceAccuracyPct: invoiceAccPct,
    invoiceLineSampleSize: invRow.lineCount || 0,

    rejectionRatePct: rejRatePct,
    rejectionLineSampleSize: rejRow.lineCount || 0,

    priceVariancePct: Math.round(Number(pvRow.avgVariancePct || 0) * 10) / 10,
    priceVarianceSampleSize: pvRow.sampleSize || 0,

    totalPoCount: poRow.poCount || 0,
    totalGrnCount: grnRow.grnCount || 0,
    totalInvoiceCount: invRow.invoiceCount || 0,

    lifetimeSpend: Number(poRow.poTotal || 0),
    avgPoValue: Number(poRow.poAvg || 0),

    monthlySpend: monthlySpend.rows,

    generatedAt: new Date().toISOString(),
  })
})