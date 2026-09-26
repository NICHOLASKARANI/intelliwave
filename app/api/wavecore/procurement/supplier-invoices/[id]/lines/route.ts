export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { assertProcurement, logProcurementEvent, procurementHandler } from '@/lib/wavecore/procurement-guard'

async function assertDraft(orgId: string, invId: string) {
  const r = await pool.query(
    `SELECT status FROM "SupplierInvoice" WHERE id = $1 AND "organizationId" = $2`,
    [invId, orgId]
  )
  if (r.rowCount === 0) return { ok: false, code: 404, error: 'Supplier invoice not found' }
  if (r.rows[0].status !== 'DRAFT') return { ok: false, code: 409, error: 'Only DRAFT invoices can be edited' }
  return { ok: true }
}

async function recalcTotals(orgId: string, invId: string) {
  const r = await pool.query(
    `SELECT COALESCE(SUM(quantity * "unitPrice"), 0)::numeric AS sub,
            COALESCE(SUM(quantity * "unitPrice" * ("taxRate" / 100)), 0)::numeric AS tax
     FROM "SupplierInvoiceLine"
     WHERE "supplierInvoiceId" = $1 AND "organizationId" = $2`,
    [invId, orgId]
  )
  const sub = Number(r.rows[0]?.sub || 0)
  const tax = Number(r.rows[0]?.tax || 0)
  const total = sub + tax
  await pool.query(
    `UPDATE "SupplierInvoice"
     SET subtotal = $1, "taxAmount" = $2, total = $3, "updatedAt" = NOW()
     WHERE id = $4 AND "organizationId" = $5`,
    [sub, tax, total, invId, orgId]
  )
  return { sub, tax, total }
}

/**
 * GET /api/wavecore/procurement/supplier-invoices/[id]/lines
 */
export const GET = procurementHandler(async (request: NextRequest, ctx: { params: { id: string } }) => {
  const g = await assertProcurement(request, 'READ')
  const id = ctx.params.id
  const r = await pool.query(
    `SELECT * FROM "SupplierInvoiceLine"
     WHERE "supplierInvoiceId" = $1 AND "organizationId" = $2
     ORDER BY COALESCE("lineNumber", 9999) ASC, "createdAt" ASC`,
    [id, g.organizationId]
  )
  return NextResponse.json({ lines: r.rows })
})

/**
 * POST /api/wavecore/procurement/supplier-invoices/[id]/lines
 * Body: { description*, quantity*, unitPrice*, taxRate?,
 *         purchaseOrderItemId?, goodsReceiptLineId?, notes? }
 */
export const POST = procurementHandler(async (request: NextRequest, ctx: { params: { id: string } }) => {
  const g = await assertProcurement(request, 'WRITE')
  const id = ctx.params.id

  const chk = await assertDraft(g.organizationId, id)
  if (!chk.ok) return NextResponse.json({ error: chk.error }, { status: chk.code })

  let body: any
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const desc = String(body?.description || '').trim()
  if (!desc) return NextResponse.json({ error: 'description required' }, { status: 400 })

  const qty = Number(body?.quantity)
  const price = Number(body?.unitPrice)
  if (!Number.isFinite(qty) || qty < 0) return NextResponse.json({ error: 'quantity must be >= 0' }, { status: 400 })
  if (!Number.isFinite(price) || price < 0) return NextResponse.json({ error: 'unitPrice must be >= 0' }, { status: 400 })
  const tax = Number(body?.taxRate) || 0
  const lineTotal = qty * price * (1 + tax / 100)

  // validate optional foreign refs are within org
  const poItemId = body?.purchaseOrderItemId ? String(body.purchaseOrderItemId) : null
  const grnLineId = body?.goodsReceiptLineId ? String(body.goodsReceiptLineId) : null

  if (poItemId) {
    const r = await pool.query(
      `SELECT poi.id FROM "PurchaseOrderItem" poi
       JOIN "PurchaseOrder" po ON po.id = poi."purchaseOrderId"
       WHERE poi.id = $1 AND po."organizationId" = $2`,
      [poItemId, g.organizationId]
    )
    if (r.rowCount === 0) return NextResponse.json({ error: 'purchaseOrderItemId not in this organization' }, { status: 400 })
  }
  if (grnLineId) {
    const r = await pool.query(
      `SELECT id FROM "GoodsReceiptLine"
       WHERE id = $1 AND "organizationId" = $2`,
      [grnLineId, g.organizationId]
    )
    if (r.rowCount === 0) return NextResponse.json({ error: 'goodsReceiptLineId not in this organization' }, { status: 400 })
  }

  const maxRes = await pool.query(
    `SELECT COALESCE(MAX("lineNumber"), 0)::int AS maxno
     FROM "SupplierInvoiceLine" WHERE "supplierInvoiceId" = $1`,
    [id]
  )
  const nextNo = (maxRes.rows[0]?.maxno || 0) + 1

  const crypto = require('crypto')
  const lineId = crypto.randomUUID()

  const ins = await pool.query(
    `INSERT INTO "SupplierInvoiceLine"
       (id, "organizationId", "supplierInvoiceId",
        "lineNumber", description, "purchaseOrderItemId", "goodsReceiptLineId",
        quantity, "unitPrice", "taxRate", "lineTotal",
        "matchedQty", "matchedAmount", "matchStatus",
        notes, "createdAt", "updatedAt")
     VALUES ($1,$2,$3,
             $4,$5,$6,$7,
             $8,$9,$10,$11,
             0,0,'UNMATCHED',
             $12,NOW(),NOW())
     RETURNING *`,
    [
      lineId, g.organizationId, id,
      nextNo, desc, poItemId, grnLineId,
      qty, price, tax, lineTotal,
      body?.notes || null,
    ]
  )

  const totals = await recalcTotals(g.organizationId, id)

  await logProcurementEvent(pool, {
    organizationId: g.organizationId,
    eventType: 'SUPPLIER_INVOICE_LINE_ADDED',
    entityType: 'SupplierInvoice',
    entityId: id,
    actorId: g.userId,
    actorName: g.userName,
    summary: 'Added line ' + nextNo,
    metadata: { lineId, lineTotal, totals },
  })

  return NextResponse.json({ line: ins.rows[0], totals }, { status: 201 })
})