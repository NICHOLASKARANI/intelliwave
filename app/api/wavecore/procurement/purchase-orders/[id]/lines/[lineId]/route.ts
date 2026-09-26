export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { assertProcurement, logProcurementEvent, procurementHandler } from '@/lib/wavecore/procurement-guard'
import { isMutable } from '@/lib/wavecore/procurement-po'

async function recomputePOTotals(poId: string, orgId: string): Promise<void> {
  const agg = await pool.query(
    `SELECT
       COALESCE(SUM(quantity * "unitPrice"), 0)::numeric AS subtotal,
       COALESCE(SUM(quantity * "unitPrice" * (COALESCE("taxRate", 0) / 100)), 0)::numeric AS tax_total
     FROM "PurchaseOrderItem"
     WHERE "purchaseOrderId" = $1`,
    [poId]
  )
  const subtotal = Number(agg.rows[0]?.subtotal || 0)
  const taxTotal = Number(agg.rows[0]?.tax_total || 0)
  const total = subtotal + taxTotal

  await pool.query(
    `UPDATE "PurchaseOrder"
     SET subtotal = $3, "taxAmount" = $4, total = $5, amount = $5, "updatedAt" = NOW()
     WHERE id = $1 AND "organizationId" = $2`,
    [poId, orgId, subtotal, taxTotal, total]
  )
}

export const PATCH = procurementHandler(async (
  request: NextRequest,
  ctx: { params: { id: string; lineId: string } }
) => {
  const g = await assertProcurement(request, 'WRITE')

  const po = await pool.query(
    `SELECT id, status FROM "PurchaseOrder" WHERE id = $1 AND "organizationId" = $2`,
    [ctx.params.id, g.organizationId]
  )
  if (po.rowCount === 0) return NextResponse.json({ error: 'Purchase order not found' }, { status: 404 })
  if (!isMutable(po.rows[0].status)) {
    return NextResponse.json({ error: 'Only DRAFT POs can be modified' }, { status: 409 })
  }

  const existing = await pool.query(
    `SELECT * FROM "PurchaseOrderItem"
     WHERE id = $1 AND "purchaseOrderId" = $2`,
    [ctx.params.lineId, ctx.params.id]
  )
  if (existing.rowCount === 0) return NextResponse.json({ error: 'Line not found' }, { status: 404 })
  const prev = existing.rows[0]

  let body: any
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const desc = body?.description !== undefined ? String(body.description).trim() : prev.description
  if (!desc) return NextResponse.json({ error: 'description cannot be empty' }, { status: 400 })

  const qty = body?.quantity !== undefined ? Number(body.quantity) : Number(prev.quantity)
  if (!Number.isFinite(qty) || qty <= 0) return NextResponse.json({ error: 'quantity must be > 0' }, { status: 400 })

  const price = body?.unitPrice !== undefined ? Number(body.unitPrice) : Number(prev.unitPrice)
  const taxRate = body?.taxRate !== undefined ? Number(body.taxRate) : Number(prev.taxRate || 0)
  const lineTotal = qty * price * (1 + taxRate / 100)

  const r = await pool.query(
    `UPDATE "PurchaseOrderItem"
     SET description = $1, "productId" = $2, quantity = $3, "unitOfMeasure" = $4,
         "unitPrice" = $5, "taxRate" = $6, total = $7, specifications = $8
     WHERE id = $9 AND "purchaseOrderId" = $10
     RETURNING *`,
    [
      desc,
      body?.productId !== undefined ? body.productId : prev.productId,
      qty,
      body?.unitOfMeasure !== undefined ? body.unitOfMeasure : prev.unitOfMeasure,
      price, taxRate, lineTotal,
      body?.specifications !== undefined ? body.specifications : prev.specifications,
      ctx.params.lineId, ctx.params.id,
    ]
  )

  await recomputePOTotals(ctx.params.id, g.organizationId)

  await logProcurementEvent(pool, {
    organizationId: g.organizationId,
    eventType: 'PURCHASE_ORDER_LINE_UPDATED',
    entityType: 'PurchaseOrder',
    entityId: ctx.params.id,
    actorId: g.userId,
    actorName: g.userName,
    summary: 'Updated line #' + prev.lineNumber,
    metadata: { lineId: ctx.params.lineId, lineTotal },
  })

  return NextResponse.json({ line: r.rows[0] })
})

export const DELETE = procurementHandler(async (
  request: NextRequest,
  ctx: { params: { id: string; lineId: string } }
) => {
  const g = await assertProcurement(request, 'WRITE')

  const po = await pool.query(
    `SELECT id, status FROM "PurchaseOrder" WHERE id = $1 AND "organizationId" = $2`,
    [ctx.params.id, g.organizationId]
  )
  if (po.rowCount === 0) return NextResponse.json({ error: 'Purchase order not found' }, { status: 404 })
  if (!isMutable(po.rows[0].status)) {
    return NextResponse.json({ error: 'Only DRAFT POs can be modified' }, { status: 409 })
  }

  const r = await pool.query(
    `DELETE FROM "PurchaseOrderItem"
     WHERE id = $1 AND "purchaseOrderId" = $2
     RETURNING "lineNumber"`,
    [ctx.params.lineId, ctx.params.id]
  )
  if (r.rowCount === 0) return NextResponse.json({ error: 'Line not found' }, { status: 404 })

  await recomputePOTotals(ctx.params.id, g.organizationId)

  await logProcurementEvent(pool, {
    organizationId: g.organizationId,
    eventType: 'PURCHASE_ORDER_LINE_DELETED',
    entityType: 'PurchaseOrder',
    entityId: ctx.params.id,
    actorId: g.userId,
    actorName: g.userName,
    summary: 'Deleted line #' + (r.rows[0]?.lineNumber || ''),
  })

  return NextResponse.json({ success: true })
})