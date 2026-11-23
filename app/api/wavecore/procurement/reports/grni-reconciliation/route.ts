/**
 * GET /api/wavecore/procurement/reports/grni-reconciliation
 *
 * Lists every Goods Receipt that has an outstanding GRNI accrual
 * (received but not yet invoiced). Total outstanding reconciles with
 * the GL balance of account 2150 (Goods Received Not Invoiced).
 *
 * Query params:
 *   from  (ISO date, optional)  — only GRNs received on/after
 *   to    (ISO date, optional)  — only GRNs received on/before
 *   supplierId (optional)       — filter by supplier
 *   bucket (optional)           — CLEARED | 0-30 | 31-60 | 61-90 | 90+
 *
 * Response:
 *   { rows: [...], totals: { received, invoiced, outstanding } }
 */

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { assertProcurement, procurementHandler } from '@/lib/wavecore/procurement-guard'

export const dynamic = 'force-dynamic'

export const GET = procurementHandler(async (request: NextRequest) => {
  const g = await assertProcurement(request, 'READ')
  const sp = request.nextUrl.searchParams
  const from = sp.get('from')
  const to = sp.get('to')
  const supplierId = sp.get('supplierId')
  const bucket = sp.get('bucket')

  const where: string[] = ['gr."organizationId" = $1', 'gr."totalReceived" > 0']
  const params: any[] = [g.organizationId]

  if (from)  { params.push(from);  where.push(`gr."receivedAt" >= $${params.length}::timestamp`) }
  if (to)    { params.push(to);    where.push(`gr."receivedAt" <= $${params.length}::timestamp`) }
  if (supplierId) { params.push(supplierId); where.push(`po."supplierId" = $${params.length}`) }

  const sql = `
    SELECT
      gr.id AS "grnId",
      gr."grnNumber",
      gr."receivedAt",
      gr.status AS "grnStatus",
      po.id AS "poId",
      po.number AS "poNumber",
      s.id AS "supplierId",
      s.name AS "supplierName",
      gr."totalReceived" AS "receivedAmount",
      COALESCE(inv.subtotal_invoiced, 0) AS "invoicedAmount",
      gr."totalReceived" - COALESCE(inv.subtotal_invoiced, 0) AS "outstandingAccrual",
      EXTRACT(DAY FROM NOW() - gr."receivedAt")::int AS "daysOutstanding",
      CASE
        WHEN gr."totalReceived" - COALESCE(inv.subtotal_invoiced, 0) <= 0.01 THEN 'CLEARED'
        WHEN EXTRACT(DAY FROM NOW() - gr."receivedAt") > 90 THEN '90+'
        WHEN EXTRACT(DAY FROM NOW() - gr."receivedAt") > 60 THEN '61-90'
        WHEN EXTRACT(DAY FROM NOW() - gr."receivedAt") > 30 THEN '31-60'
        ELSE '0-30'
      END AS "agingBucket"
    FROM "GoodsReceipt" gr
    LEFT JOIN "PurchaseOrder" po ON po.id = gr."purchaseOrderId"
    LEFT JOIN "Supplier" s ON s.id = po."supplierId"
    LEFT JOIN (
      SELECT "goodsReceiptId", SUM(subtotal) AS subtotal_invoiced
      FROM "SupplierInvoice"
      WHERE status = 'APPROVED' AND "goodsReceiptId" IS NOT NULL
      GROUP BY "goodsReceiptId"
    ) inv ON inv."goodsReceiptId" = gr.id
    WHERE ${where.join(' AND ')}
    ORDER BY gr."receivedAt" DESC
  `

  const res = await pool.query(sql, params)
  let rows = res.rows
  if (bucket) rows = rows.filter((r: any) => r.agingBucket === bucket)

  const totals = rows.reduce((acc: any, r: any) => ({
    received:    acc.received    + Number(r.receivedAmount),
    invoiced:    acc.invoiced    + Number(r.invoicedAmount),
    outstanding: acc.outstanding + Number(r.outstandingAccrual),
  }), { received: 0, invoiced: 0, outstanding: 0 })

  return NextResponse.json({ rows, totals, count: rows.length })
})