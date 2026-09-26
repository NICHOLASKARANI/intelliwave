export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { assertProcurement, logProcurementEvent, procurementHandler } from '@/lib/wavecore/procurement-guard'

/**
 * GET /api/wavecore/procurement/goods-receipts/[id]
 * Returns header + lines + PO summary + supplier + inspections + activity.
 * Tenant-scoped via organizationId.
 */
export const GET = procurementHandler(async (request: NextRequest, ctx: { params: { id: string } }) => {
  const g = await assertProcurement(request, 'READ')
  const id = ctx.params.id

  const grnRes = await pool.query(
    `SELECT * FROM "GoodsReceipt"
     WHERE id = $1 AND "organizationId" = $2`,
    [id, g.organizationId]
  )
  if (grnRes.rowCount === 0) {
    return NextResponse.json({ error: 'Goods receipt not found' }, { status: 404 })
  }
  const grn = grnRes.rows[0]

  const [linesRes, poRes, supplierRes, inspectionsRes, activityRes] = await Promise.all([
    pool.query(
      `SELECT l.*, poi.description AS "poDescription"
       FROM "GoodsReceiptLine" l
       LEFT JOIN "PurchaseOrderItem" poi ON poi.id = l."purchaseOrderItemId"
       WHERE l."goodsReceiptId" = $1 AND l."organizationId" = $2
       ORDER BY COALESCE(l."lineNumber", 9999) ASC, l."createdAt" ASC`,
      [id, g.organizationId]
    ),
    grn.purchaseOrderId
      ? pool.query(
          `SELECT id, number, status, "supplierName", "supplierId", currency,
                  subtotal, "taxAmount", total, "amount", "deliveryDate",
                  "createdAt"
           FROM "PurchaseOrder"
           WHERE id = $1 AND "organizationId" = $2`,
          [grn.purchaseOrderId, g.organizationId]
        )
      : Promise.resolve({ rows: [] }),
    pool.query(
      `SELECT id, name, "legalName", email, phone, address, city, country, "taxPin"
       FROM "Supplier"
       WHERE id = (SELECT "supplierId" FROM "PurchaseOrder" WHERE id = $1 AND "organizationId" = $2)
       LIMIT 1`,
      [grn.purchaseOrderId, g.organizationId]
    ).catch(() => ({ rows: [] })),
    pool.query(
      `SELECT * FROM "QualityInspection"
       WHERE "goodsReceiptId" = $1 AND "organizationId" = $2
       ORDER BY "createdAt" ASC`,
      [id, g.organizationId]
    ),
    pool.query(
      `SELECT id, "eventType", summary, "actorName", "createdAt", metadata
       FROM "ProcurementEvent"
       WHERE "organizationId" = $1
         AND "entityType" = 'GoodsReceipt'
         AND "entityId" = $2
       ORDER BY "createdAt" DESC
       LIMIT 50`,
      [g.organizationId, id]
    ).catch(() => ({ rows: [] })),
  ])

  return NextResponse.json({
    goodsReceipt: grn,
    lines: linesRes.rows,
    purchaseOrder: poRes.rows[0] || null,
    supplier: supplierRes.rows[0] || null,
    inspections: inspectionsRes.rows,
    activity: activityRes.rows,
  })
})

/**
 * PATCH /api/wavecore/procurement/goods-receipts/[id]
 * Only allowed when status = DRAFT.
 * Editable header fields: deliveryNoteNumber, vehicleNumber, driverName,
 * warehouseId, locationId, receivedAt, notes.
 */
export const PATCH = procurementHandler(async (request: NextRequest, ctx: { params: { id: string } }) => {
  const g = await assertProcurement(request, 'WRITE')
  const id = ctx.params.id

  const existing = await pool.query(
    `SELECT status FROM "GoodsReceipt" WHERE id = $1 AND "organizationId" = $2`,
    [id, g.organizationId]
  )
  if (existing.rowCount === 0) {
    return NextResponse.json({ error: 'Goods receipt not found' }, { status: 404 })
  }
  if (existing.rows[0].status !== 'DRAFT') {
    return NextResponse.json({ error: 'Only DRAFT goods receipts can be edited' }, { status: 409 })
  }

  let body: any
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const editable: Record<string, string> = {
    deliveryNoteNumber: 'deliveryNoteNumber',
    deliveryNoteUrl:    'deliveryNoteUrl',
    vehicleNumber:      'vehicleNumber',
    driverName:         'driverName',
    warehouseId:        'warehouseId',
    locationId:         'locationId',
    receivedAt:         'receivedAt',
    notes:              'notes',
  }

  const sets: string[] = []
  const values: any[] = []
  for (const [k, col] of Object.entries(editable)) {
    if (k in body) {
      values.push(body[k] === '' ? null : body[k])
      sets.push(`"${col}" = $${values.length}`)
    }
  }
  if (sets.length === 0) {
    return NextResponse.json({ error: 'No editable fields provided' }, { status: 400 })
  }
  sets.push(`"updatedAt" = NOW()`)

  values.push(id)
  const idParam = values.length
  values.push(g.organizationId)
  const orgParam = values.length

  const upd = await pool.query(
    `UPDATE "GoodsReceipt" SET ${sets.join(', ')}
     WHERE id = $${idParam} AND "organizationId" = $${orgParam}
     RETURNING *`,
    values
  )

  await logProcurementEvent(pool, {
    organizationId: g.organizationId,
    eventType: 'GOODS_RECEIPT_UPDATED',
    entityType: 'GoodsReceipt',
    entityId: id,
    actorId: g.userId,
    actorName: g.userName,
    summary: 'Updated GRN header',
    metadata: { fields: Object.keys(body) },
  })

  return NextResponse.json({ goodsReceipt: upd.rows[0] })
})

/**
 * DELETE /api/wavecore/procurement/goods-receipts/[id]
 * Only allowed when status = DRAFT.
 * Cascade deletes lines. Does NOT touch PO receivedQty (only applies after submit).
 */
export const DELETE = procurementHandler(async (request: NextRequest, ctx: { params: { id: string } }) => {
  const g = await assertProcurement(request, 'WRITE')
  const id = ctx.params.id

  const existing = await pool.query(
    `SELECT status, "grnNumber" FROM "GoodsReceipt" WHERE id = $1 AND "organizationId" = $2`,
    [id, g.organizationId]
  )
  if (existing.rowCount === 0) {
    return NextResponse.json({ error: 'Goods receipt not found' }, { status: 404 })
  }
  if (existing.rows[0].status !== 'DRAFT') {
    return NextResponse.json({ error: 'Only DRAFT goods receipts can be deleted' }, { status: 409 })
  }

  await pool.query(`DELETE FROM "GoodsReceiptLine" WHERE "goodsReceiptId" = $1 AND "organizationId" = $2`, [id, g.organizationId])
  await pool.query(`DELETE FROM "GoodsReceipt" WHERE id = $1 AND "organizationId" = $2`, [id, g.organizationId])

  await logProcurementEvent(pool, {
    organizationId: g.organizationId,
    eventType: 'GOODS_RECEIPT_DELETED',
    entityType: 'GoodsReceipt',
    entityId: id,
    actorId: g.userId,
    actorName: g.userName,
    summary: 'Deleted GRN ' + existing.rows[0].grnNumber,
    metadata: { grnNumber: existing.rows[0].grnNumber },
  })

  return NextResponse.json({ ok: true })
})