export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { assertProcurement, logProcurementEvent, procurementHandler } from '@/lib/wavecore/procurement-guard'

async function recomputeRequisitionTotals(
  requisitionId: string,
  organizationId: string
): Promise<void> {
  const agg = await pool.query(
    `SELECT
       COALESCE(SUM(quantity * "unitPrice"), 0)::numeric AS subtotal,
       COALESCE(SUM(quantity * "unitPrice" * ("taxRate" / 100)), 0)::numeric AS tax_total
     FROM "PurchaseRequisitionLine"
     WHERE "requisitionId" = $1 AND "organizationId" = $2`,
    [requisitionId, organizationId]
  )
  const subtotal = Number(agg.rows[0]?.subtotal || 0)
  const taxTotal = Number(agg.rows[0]?.tax_total || 0)
  const total = subtotal + taxTotal

  await pool.query(
    `UPDATE "PurchaseRequisition"
     SET subtotal = $3, "taxAmount" = $4, "totalAmount" = $5, "updatedAt" = NOW()
     WHERE id = $1 AND "organizationId" = $2`,
    [requisitionId, organizationId, subtotal, taxTotal, total]
  )
}

/**
 * PATCH /api/wavecore/procurement/requisitions/[id]/lines/[lineId]
 */
export const PATCH = procurementHandler(async (
  request: NextRequest,
  ctx: { params: { id: string; lineId: string } }
) => {
  const g = await assertProcurement(request, 'WRITE')

  const req = await pool.query(
    `SELECT id, status FROM "PurchaseRequisition"
     WHERE id = $1 AND "organizationId" = $2`,
    [ctx.params.id, g.organizationId]
  )
  if (req.rowCount === 0) return NextResponse.json({ error: 'Requisition not found' }, { status: 404 })
  if (req.rows[0].status !== 'DRAFT') {
    return NextResponse.json({ error: 'Only DRAFT requisitions can be modified' }, { status: 409 })
  }

  const existing = await pool.query(
    `SELECT * FROM "PurchaseRequisitionLine"
     WHERE id = $1 AND "requisitionId" = $2 AND "organizationId" = $3`,
    [ctx.params.lineId, ctx.params.id, g.organizationId]
  )
  if (existing.rowCount === 0) return NextResponse.json({ error: 'Line not found' }, { status: 404 })
  const prev = existing.rows[0]

  let body: any
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const description = body?.description !== undefined ? String(body.description).trim() : prev.description
  if (!description) return NextResponse.json({ error: 'description cannot be empty' }, { status: 400 })

  const qty = body?.quantity !== undefined ? Number(body.quantity) : Number(prev.quantity)
  if (!Number.isFinite(qty) || qty <= 0) return NextResponse.json({ error: 'quantity must be > 0' }, { status: 400 })

  const price = body?.unitPrice !== undefined ? Number(body.unitPrice) : Number(prev.unitPrice)
  const taxRate = body?.taxRate !== undefined ? Number(body.taxRate) : Number(prev.taxRate)

  const lineSubtotal = qty * price
  const lineTax = lineSubtotal * (taxRate / 100)
  const lineTotal = lineSubtotal + lineTax

  const updates = {
    description,
    productId: body?.productId !== undefined ? body.productId : prev.productId,
    category: body?.category !== undefined ? body.category : prev.category,
    quantity: qty,
    unitOfMeasure: body?.unitOfMeasure !== undefined ? body.unitOfMeasure : prev.unitOfMeasure,
    unitPrice: price,
    taxRate,
    lineTotal,
    specifications: body?.specifications !== undefined ? body.specifications : prev.specifications,
    preferredSupplierId: body?.preferredSupplierId !== undefined ? body.preferredSupplierId : prev.preferredSupplierId,
    notes: body?.notes !== undefined ? body.notes : prev.notes,
  }

  const r = await pool.query(
    `UPDATE "PurchaseRequisitionLine"
     SET description = $1, "productId" = $2, category = $3, quantity = $4,
         "unitOfMeasure" = $5, "unitPrice" = $6, "taxRate" = $7, "lineTotal" = $8,
         specifications = $9, "preferredSupplierId" = $10, notes = $11, "updatedAt" = NOW()
     WHERE id = $12 AND "requisitionId" = $13 AND "organizationId" = $14
     RETURNING *`,
    [
      updates.description, updates.productId, updates.category, updates.quantity,
      updates.unitOfMeasure, updates.unitPrice, updates.taxRate, updates.lineTotal,
      updates.specifications, updates.preferredSupplierId, updates.notes,
      ctx.params.lineId, ctx.params.id, g.organizationId,
    ]
  )

  await recomputeRequisitionTotals(ctx.params.id, g.organizationId)

  await logProcurementEvent(pool, {
    organizationId: g.organizationId,
    eventType: 'REQUISITION_LINE_UPDATED',
    entityType: 'PurchaseRequisition',
    entityId: ctx.params.id,
    actorId: g.userId,
    actorName: g.userName,
    summary: 'Updated line #' + prev.lineNumber,
    metadata: { lineId: ctx.params.lineId, lineTotal },
  })

  return NextResponse.json({ line: r.rows[0] })
})

/**
 * DELETE /api/wavecore/procurement/requisitions/[id]/lines/[lineId]
 */
export const DELETE = procurementHandler(async (
  request: NextRequest,
  ctx: { params: { id: string; lineId: string } }
) => {
  const g = await assertProcurement(request, 'WRITE')

  const req = await pool.query(
    `SELECT id, status FROM "PurchaseRequisition"
     WHERE id = $1 AND "organizationId" = $2`,
    [ctx.params.id, g.organizationId]
  )
  if (req.rowCount === 0) return NextResponse.json({ error: 'Requisition not found' }, { status: 404 })
  if (req.rows[0].status !== 'DRAFT') {
    return NextResponse.json({ error: 'Only DRAFT requisitions can be modified' }, { status: 409 })
  }

  const r = await pool.query(
    `DELETE FROM "PurchaseRequisitionLine"
     WHERE id = $1 AND "requisitionId" = $2 AND "organizationId" = $3
     RETURNING "lineNumber"`,
    [ctx.params.lineId, ctx.params.id, g.organizationId]
  )
  if (r.rowCount === 0) return NextResponse.json({ error: 'Line not found' }, { status: 404 })

  await recomputeRequisitionTotals(ctx.params.id, g.organizationId)

  await logProcurementEvent(pool, {
    organizationId: g.organizationId,
    eventType: 'REQUISITION_LINE_DELETED',
    entityType: 'PurchaseRequisition',
    entityId: ctx.params.id,
    actorId: g.userId,
    actorName: g.userName,
    summary: 'Deleted line #' + (r.rows[0]?.lineNumber || ''),
  })

  return NextResponse.json({ success: true })
})