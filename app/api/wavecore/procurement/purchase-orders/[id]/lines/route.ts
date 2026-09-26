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

export const GET = procurementHandler(async (request: NextRequest, ctx: { params: { id: string } }) => {
  const g = await assertProcurement(request, 'READ')
  const owner = await pool.query(
    `SELECT id FROM "PurchaseOrder" WHERE id = $1 AND "organizationId" = $2`,
    [ctx.params.id, g.organizationId]
  )
  if (owner.rowCount === 0) return NextResponse.json({ error: 'Purchase order not found' }, { status: 404 })

  const r = await pool.query(
    `SELECT * FROM "PurchaseOrderItem"
     WHERE "purchaseOrderId" = $1
     ORDER BY COALESCE("lineNumber", 9999) ASC, "createdAt" ASC`,
    [ctx.params.id]
  )
  return NextResponse.json({ lines: r.rows })
})

export const POST = procurementHandler(async (request: NextRequest, ctx: { params: { id: string } }) => {
  const g = await assertProcurement(request, 'WRITE')

  const po = await pool.query(
    `SELECT id, status, number FROM "PurchaseOrder"
     WHERE id = $1 AND "organizationId" = $2`,
    [ctx.params.id, g.organizationId]
  )
  if (po.rowCount === 0) return NextResponse.json({ error: 'Purchase order not found' }, { status: 404 })
  if (!isMutable(po.rows[0].status)) {
    return NextResponse.json({ error: 'Only DRAFT POs can be modified' }, { status: 409 })
  }

  let body: any
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const desc = String(body?.description || '').trim()
  if (!desc) return NextResponse.json({ error: 'description is required' }, { status: 400 })

  const qty = Number(body?.quantity)
  if (!Number.isFinite(qty) || qty <= 0) return NextResponse.json({ error: 'quantity must be > 0' }, { status: 400 })

  const price = Number(body?.unitPrice) || 0
  const taxRate = Number(body?.taxRate) || 0
  const lineSub = qty * price
  const lineTotal = lineSub * (1 + taxRate / 100)

  const maxRes = await pool.query(
    `SELECT COALESCE(MAX("lineNumber"), 0)::int AS m FROM "PurchaseOrderItem"
     WHERE "purchaseOrderId" = $1`,
    [ctx.params.id]
  )
  const nextLine = Number(maxRes.rows[0]?.m || 0) + 1

  const crypto = require('crypto')
  const id = crypto.randomUUID()

  const insert = await pool.query(
    `INSERT INTO "PurchaseOrderItem"
       (id, "organizationId", "purchaseOrderId", "lineNumber", description,
        "productId", quantity, "unitOfMeasure", "unitPrice", "taxRate",
        total, "receivedQty", "invoicedQty", specifications, "createdAt")
     VALUES ($1,$2,$3,$4,$5,
             $6,$7,$8,$9,$10,
             $11,0,0,$12,NOW())
     RETURNING *`,
    [
      id, g.organizationId, ctx.params.id, nextLine, desc,
      body?.productId || null,
      qty,
      body?.unitOfMeasure || 'UNIT',
      price, taxRate, lineTotal,
      body?.specifications || null,
    ]
  )

  await recomputePOTotals(ctx.params.id, g.organizationId)

  await logProcurementEvent(pool, {
    organizationId: g.organizationId,
    eventType: 'PURCHASE_ORDER_LINE_ADDED',
    entityType: 'PurchaseOrder',
    entityId: ctx.params.id,
    actorId: g.userId,
    actorName: g.userName,
    summary: 'Added line #' + nextLine + ' to ' + (po.rows[0].number || ctx.params.id),
    metadata: { lineId: id, quantity: qty, unitPrice: price, lineTotal },
  })

  return NextResponse.json({ line: insert.rows[0] }, { status: 201 })
})