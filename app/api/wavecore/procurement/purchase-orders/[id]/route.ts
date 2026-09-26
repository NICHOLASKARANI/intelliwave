export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { assertProcurement, logProcurementEvent, procurementHandler } from '@/lib/wavecore/procurement-guard'
import { isMutable } from '@/lib/wavecore/procurement-po'

export const GET = procurementHandler(async (request: NextRequest, ctx: { params: { id: string } }) => {
  const g = await assertProcurement(request, 'READ')
  const id = ctx.params.id

  const poRes = await pool.query(
    `SELECT * FROM "PurchaseOrder" WHERE id = $1 AND "organizationId" = $2`,
    [id, g.organizationId]
  )
  if (poRes.rowCount === 0) return NextResponse.json({ error: 'Purchase order not found' }, { status: 404 })

  const [linesRes, approvalsRes, eventsRes, supplierRes, requisitionRes] = await Promise.all([
    pool.query(
      `SELECT * FROM "PurchaseOrderItem"
       WHERE "purchaseOrderId" = $1 ORDER BY COALESCE("lineNumber", 9999) ASC, "createdAt" ASC`,
      [id]
    ),
    pool.query(
      `SELECT * FROM "ProcurementApproval"
       WHERE "entityType" = 'PurchaseOrder' AND "entityId" = $1 AND "organizationId" = $2
       ORDER BY "stepNumber" ASC`,
      [id, g.organizationId]
    ),
    pool.query(
      `SELECT id, "eventType", "summary", "actorName", metadata, "createdAt"
       FROM "ProcurementEvent"
       WHERE "entityType" = 'PurchaseOrder' AND "entityId" = $1 AND "organizationId" = $2
       ORDER BY "createdAt" DESC LIMIT 50`,
      [id, g.organizationId]
    ),
    poRes.rows[0].supplierId
      ? pool.query(`SELECT id, name, "legalName", email, phone, currency, "paymentTerms", status, "riskLevel" FROM "Supplier" WHERE id = $1`, [poRes.rows[0].supplierId])
      : Promise.resolve({ rows: [] }),
    poRes.rows[0].requisitionId
      ? pool.query(`SELECT id, "requisitionNumber", title, "totalAmount", currency, status FROM "PurchaseRequisition" WHERE id = $1 AND "organizationId" = $2`, [poRes.rows[0].requisitionId, g.organizationId])
      : Promise.resolve({ rows: [] }),
  ])

  return NextResponse.json({
    purchaseOrder: poRes.rows[0],
    lines: linesRes.rows,
    approvals: approvalsRes.rows,
    activity: eventsRes.rows,
    supplier: supplierRes.rows[0] || null,
    requisition: requisitionRes.rows[0] || null,
  })
})

export const PATCH = procurementHandler(async (request: NextRequest, ctx: { params: { id: string } }) => {
  const g = await assertProcurement(request, 'WRITE')
  const id = ctx.params.id

  const existing = await pool.query(
    `SELECT * FROM "PurchaseOrder" WHERE id = $1 AND "organizationId" = $2`,
    [id, g.organizationId]
  )
  if (existing.rowCount === 0) return NextResponse.json({ error: 'Purchase order not found' }, { status: 404 })
  if (!isMutable(existing.rows[0].status)) {
    return NextResponse.json({ error: 'Only DRAFT POs can be edited (current: ' + existing.rows[0].status + ')' }, { status: 409 })
  }

  let body: any
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const allowed = ['supplierId', 'supplierName', 'type', 'currency', 'paymentTerms',
                   'deliveryDate', 'deliveryLocation', 'incoterms', 'notes']
  const sets: string[] = []
  const params: any[] = []
  const changed: string[] = []

  for (const k of allowed) {
    if (k in body) {
      params.push(body[k])
      sets.push('"' + k + '" = $' + params.length)
      changed.push(k)
    }
  }

  if (sets.length === 0) return NextResponse.json({ error: 'No updatable fields' }, { status: 400 })

  params.push(id, g.organizationId)
  const n = params.length

  const r = await pool.query(
    `UPDATE "PurchaseOrder" SET ${sets.join(', ')}, "updatedAt" = NOW()
     WHERE id = $${n - 1} AND "organizationId" = $${n}
     RETURNING *`,
    params
  )

  await logProcurementEvent(pool, {
    organizationId: g.organizationId,
    eventType: 'PURCHASE_ORDER_UPDATED',
    entityType: 'PurchaseOrder',
    entityId: id,
    actorId: g.userId,
    actorName: g.userName,
    summary: 'Updated PO ' + (r.rows[0]?.number || id),
    metadata: { fields: changed },
  })

  return NextResponse.json({ purchaseOrder: r.rows[0] })
})

export const DELETE = procurementHandler(async (request: NextRequest, ctx: { params: { id: string } }) => {
  const g = await assertProcurement(request, 'WRITE')
  const id = ctx.params.id

  const existing = await pool.query(
    `SELECT * FROM "PurchaseOrder" WHERE id = $1 AND "organizationId" = $2`,
    [id, g.organizationId]
  )
  if (existing.rowCount === 0) return NextResponse.json({ error: 'Purchase order not found' }, { status: 404 })
  if (existing.rows[0].status !== 'DRAFT') {
    return NextResponse.json({ error: 'Only DRAFT POs can be deleted' }, { status: 409 })
  }

  await pool.query(`DELETE FROM "PurchaseOrderItem" WHERE "purchaseOrderId" = $1`, [id])
  await pool.query(
    `DELETE FROM "ProcurementApproval" WHERE "entityType" = 'PurchaseOrder' AND "entityId" = $1 AND "organizationId" = $2`,
    [id, g.organizationId]
  )
  await pool.query(`DELETE FROM "PurchaseOrder" WHERE id = $1 AND "organizationId" = $2`, [id, g.organizationId])

  await logProcurementEvent(pool, {
    organizationId: g.organizationId,
    eventType: 'PURCHASE_ORDER_DELETED',
    entityType: 'PurchaseOrder',
    entityId: id,
    actorId: g.userId,
    actorName: g.userName,
    summary: 'Deleted draft PO ' + (existing.rows[0].number || id),
  })

  return NextResponse.json({ success: true })
})