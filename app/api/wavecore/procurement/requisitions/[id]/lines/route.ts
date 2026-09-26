export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { assertProcurement, logProcurementEvent, procurementHandler } from '@/lib/wavecore/procurement-guard'

/**
 * Recompute parent requisition's subtotal / taxAmount / totalAmount from its lines.
 */
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
 * GET /api/wavecore/procurement/requisitions/[id]/lines
 */
export const GET = procurementHandler(async (request: NextRequest, ctx: { params: { id: string } }) => {
  const g = await assertProcurement(request, 'READ')

  const owner = await pool.query(
    `SELECT id FROM "PurchaseRequisition" WHERE id = $1 AND "organizationId" = $2`,
    [ctx.params.id, g.organizationId]
  )
  if (owner.rowCount === 0) return NextResponse.json({ error: 'Requisition not found' }, { status: 404 })

  const r = await pool.query(
    `SELECT * FROM "PurchaseRequisitionLine"
     WHERE "requisitionId" = $1 AND "organizationId" = $2
     ORDER BY "lineNumber" ASC`,
    [ctx.params.id, g.organizationId]
  )
  return NextResponse.json({ lines: r.rows })
})

/**
 * POST /api/wavecore/procurement/requisitions/[id]/lines
 * Body: { description*, quantity*, unitPrice?, taxRate?, unitOfMeasure?, productId?, category?, specifications?, preferredSupplierId?, notes? }
 */
export const POST = procurementHandler(async (request: NextRequest, ctx: { params: { id: string } }) => {
  const g = await assertProcurement(request, 'WRITE')

  const req = await pool.query(
    `SELECT id, status, "requisitionNumber" FROM "PurchaseRequisition"
     WHERE id = $1 AND "organizationId" = $2`,
    [ctx.params.id, g.organizationId]
  )
  if (req.rowCount === 0) return NextResponse.json({ error: 'Requisition not found' }, { status: 404 })
  if (req.rows[0].status !== 'DRAFT') {
    return NextResponse.json({ error: 'Only DRAFT requisitions can be modified' }, { status: 409 })
  }

  let body: any
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const desc = String(body?.description || '').trim()
  if (!desc) return NextResponse.json({ error: 'description is required' }, { status: 400 })

  const qty = Number(body?.quantity)
  if (!Number.isFinite(qty) || qty <= 0) return NextResponse.json({ error: 'quantity must be > 0' }, { status: 400 })

  const price = Number(body?.unitPrice) || 0
  const taxRate = Number(body?.taxRate) || 0
  const lineSubtotal = qty * price
  const lineTax = lineSubtotal * (taxRate / 100)
  const lineTotal = lineSubtotal + lineTax

  // Get next lineNumber
  const maxRes = await pool.query(
    `SELECT COALESCE(MAX("lineNumber"), 0)::int AS m FROM "PurchaseRequisitionLine"
     WHERE "requisitionId" = $1 AND "organizationId" = $2`,
    [ctx.params.id, g.organizationId]
  )
  const nextLine = Number(maxRes.rows[0]?.m || 0) + 1

  const crypto = require('crypto')
  const id = crypto.randomUUID()

  const insert = await pool.query(
    `INSERT INTO "PurchaseRequisitionLine"
       (id, "organizationId", "requisitionId", "lineNumber", description,
        "productId", category, quantity, "unitOfMeasure", "unitPrice", "taxRate",
        "lineTotal", specifications, "preferredSupplierId", notes, "createdAt", "updatedAt")
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,NOW(),NOW())
     RETURNING *`,
    [
      id, g.organizationId, ctx.params.id, nextLine, desc,
      body?.productId || null,
      body?.category || null,
      qty,
      body?.unitOfMeasure || 'UNIT',
      price, taxRate, lineTotal,
      body?.specifications || null,
      body?.preferredSupplierId || null,
      body?.notes || null,
    ]
  )

  await recomputeRequisitionTotals(ctx.params.id, g.organizationId)

  await logProcurementEvent(pool, {
    organizationId: g.organizationId,
    eventType: 'REQUISITION_LINE_ADDED',
    entityType: 'PurchaseRequisition',
    entityId: ctx.params.id,
    actorId: g.userId,
    actorName: g.userName,
    summary: 'Added line #' + nextLine + ' to ' + (req.rows[0].requisitionNumber || ctx.params.id),
    metadata: { lineId: id, quantity: qty, unitPrice: price, lineTotal },
  })

  return NextResponse.json({ line: insert.rows[0] }, { status: 201 })
})