export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { assertProcurement, logProcurementEvent, procurementHandler } from '@/lib/wavecore/procurement-guard'

/**
 * GET /api/wavecore/procurement/rfqs/[id]
 */
export const GET = procurementHandler(async (request: NextRequest, ctx: { params: { id: string } }) => {
  const g = await assertProcurement(request, 'READ')
  const id = ctx.params.id

  const r = await pool.query(
    `SELECT * FROM "RFQ" WHERE id = $1 AND "organizationId" = $2`,
    [id, g.organizationId]
  )
  if (r.rowCount === 0) return NextResponse.json({ error: 'RFQ not found' }, { status: 404 })
  const rfq = r.rows[0]

  const [linesRes, invitesRes, quotesRes, requisitionRes, poRes] = await Promise.all([
    pool.query(
      `SELECT * FROM "RFQLine"
       WHERE "rfqId" = $1 AND "organizationId" = $2
       ORDER BY COALESCE("lineNumber", 9999) ASC`,
      [id, g.organizationId]
    ),
    pool.query(
      `SELECT i.*, s.name AS "supplierName", s."legalName" AS "supplierLegalName",
              s.email AS "supplierEmail", s.phone AS "supplierPhone"
       FROM "RFQSupplierInvite" i
       LEFT JOIN "Supplier" s ON s.id = i."supplierId"
       WHERE i."rfqId" = $1 AND i."organizationId" = $2
       ORDER BY i."invitedAt" ASC`,
      [id, g.organizationId]
    ),
    pool.query(
      `SELECT q.*, s.name AS "supplierName"
       FROM "SupplierQuoteExt" q
       LEFT JOIN "Supplier" s ON s.id = q."supplierId"
       WHERE q."rfqId" = $1 AND q."organizationId" = $2
       ORDER BY q."supplierId", q."rfqLineId"`,
      [id, g.organizationId]
    ),
    rfq.requisitionId
      ? pool.query(
          `SELECT id, "requisitionNumber", title, status, currency, "totalAmount"
           FROM "PurchaseRequisition"
           WHERE id = $1 AND "organizationId" = $2`,
          [rfq.requisitionId, g.organizationId]
        )
      : Promise.resolve({ rows: [] }),
    rfq.purchaseOrderId
      ? pool.query(
          `SELECT id, number, status, "supplierName"
           FROM "PurchaseOrder"
           WHERE id = $1 AND "organizationId" = $2`,
          [rfq.purchaseOrderId, g.organizationId]
        )
      : Promise.resolve({ rows: [] }),
  ])

  return NextResponse.json({
    rfq,
    lines: linesRes.rows,
    invites: invitesRes.rows,
    quotes: quotesRes.rows,
    requisition: requisitionRes.rows[0] || null,
    purchaseOrder: poRes.rows[0] || null,
  })
})

/**
 * PATCH /api/wavecore/procurement/rfqs/[id]
 * Editable while DRAFT or PUBLISHED.
 */
export const PATCH = procurementHandler(async (request: NextRequest, ctx: { params: { id: string } }) => {
  const g = await assertProcurement(request, 'WRITE')
  const id = ctx.params.id

  const cur = await pool.query(
    `SELECT status FROM "RFQ" WHERE id = $1 AND "organizationId" = $2`,
    [id, g.organizationId]
  )
  if (cur.rowCount === 0) return NextResponse.json({ error: 'RFQ not found' }, { status: 404 })
  if (!['DRAFT','PUBLISHED'].includes(cur.rows[0].status)) {
    return NextResponse.json({ error: 'Cannot edit RFQ in status ' + cur.rows[0].status }, { status: 409 })
  }

  let body: any
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const editable: Record<string, string> = {
    title: 'title',
    description: 'description',
    type: 'type',
    category: 'category',
    currency: 'currency',
    issueDate: 'issueDate',
    closingDate: 'closingDate',
    deliveryDate: 'deliveryDate',
    deliveryLocation: 'deliveryLocation',
    paymentTerms: 'paymentTerms',
    notes: 'notes',
  }
  const sets: string[] = []
  const values: any[] = []
  for (const [k, col] of Object.entries(editable)) {
    if (k in body) {
      values.push(body[k] === '' ? null : body[k])
      sets.push(`"${col}" = $${values.length}`)
    }
  }
  if ('evaluationCriteria' in body) {
    values.push(body.evaluationCriteria ? JSON.stringify(body.evaluationCriteria) : null)
    sets.push(`"evaluationCriteria" = $${values.length}::jsonb`)
  }
  if (sets.length === 0) return NextResponse.json({ error: 'No editable fields provided' }, { status: 400 })
  sets.push(`"updatedAt" = NOW()`)

  values.push(id); const idParam = values.length
  values.push(g.organizationId); const orgParam = values.length

  const upd = await pool.query(
    `UPDATE "RFQ" SET ${sets.join(', ')}
     WHERE id = $${idParam} AND "organizationId" = $${orgParam}
     RETURNING *`,
    values
  )

  await logProcurementEvent(pool, {
    organizationId: g.organizationId,
    eventType: 'RFQ_UPDATED',
    entityType: 'RFQ',
    entityId: id,
    actorId: g.userId,
    actorName: g.userName,
    summary: 'Updated RFQ header',
    metadata: { fields: Object.keys(body) },
  })

  return NextResponse.json({ rfq: upd.rows[0] })
})

/**
 * DELETE /api/wavecore/procurement/rfqs/[id]
 * DRAFT only.
 */
export const DELETE = procurementHandler(async (request: NextRequest, ctx: { params: { id: string } }) => {
  const g = await assertProcurement(request, 'WRITE')
  const id = ctx.params.id

  const cur = await pool.query(
    `SELECT status, "rfqNumber" FROM "RFQ" WHERE id = $1 AND "organizationId" = $2`,
    [id, g.organizationId]
  )
  if (cur.rowCount === 0) return NextResponse.json({ error: 'RFQ not found' }, { status: 404 })
  if (cur.rows[0].status !== 'DRAFT') {
    return NextResponse.json({ error: 'Only DRAFT RFQs can be deleted' }, { status: 409 })
  }

  await pool.query(`DELETE FROM "RFQLine" WHERE "rfqId" = $1 AND "organizationId" = $2`, [id, g.organizationId])
  await pool.query(`DELETE FROM "RFQSupplierInvite" WHERE "rfqId" = $1 AND "organizationId" = $2`, [id, g.organizationId])
  await pool.query(`DELETE FROM "SupplierQuoteExt" WHERE "rfqId" = $1 AND "organizationId" = $2`, [id, g.organizationId])
  await pool.query(`DELETE FROM "RFQ" WHERE id = $1 AND "organizationId" = $2`, [id, g.organizationId])

  await logProcurementEvent(pool, {
    organizationId: g.organizationId,
    eventType: 'RFQ_DELETED',
    entityType: 'RFQ',
    entityId: id,
    actorId: g.userId,
    actorName: g.userName,
    summary: 'Deleted ' + cur.rows[0].rfqNumber,
    metadata: { rfqNumber: cur.rows[0].rfqNumber },
  })

  return NextResponse.json({ ok: true })
})