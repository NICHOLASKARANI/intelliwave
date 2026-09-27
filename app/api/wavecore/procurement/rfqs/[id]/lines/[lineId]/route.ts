export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { assertProcurement, logProcurementEvent, procurementHandler } from '@/lib/wavecore/procurement-guard'

async function assertDraftOwned(orgId: string, rfqId: string, lineId: string) {
  const c = await pool.query(
    `SELECT status FROM "RFQ" WHERE id = $1 AND "organizationId" = $2`,
    [rfqId, orgId]
  )
  if (c.rowCount === 0) return { ok: false, code: 404, error: 'RFQ not found' }
  if (c.rows[0].status !== 'DRAFT') return { ok: false, code: 409, error: 'Lines can only be edited while DRAFT' }

  const l = await pool.query(
    `SELECT * FROM "RFQLine"
     WHERE id = $1 AND "rfqId" = $2 AND "organizationId" = $3`,
    [lineId, rfqId, orgId]
  )
  if (l.rowCount === 0) return { ok: false, code: 404, error: 'Line not found' }
  return { ok: true, line: l.rows[0] }
}

export const PATCH = procurementHandler(async (request: NextRequest, ctx: { params: { id: string; lineId: string } }) => {
  const g = await assertProcurement(request, 'WRITE')
  const { id, lineId } = ctx.params
  const chk = await assertDraftOwned(g.organizationId, id, lineId)
  if (!chk.ok) return NextResponse.json({ error: chk.error }, { status: chk.code })
  const existing = chk.line

  let body: any
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const desc = 'description' in body ? String(body.description).trim() : existing.description
  if (!desc) return NextResponse.json({ error: 'description cannot be empty' }, { status: 400 })
  const qty = 'quantity' in body ? Number(body.quantity) : Number(existing.quantity)
  const uom = 'unitOfMeasure' in body ? body.unitOfMeasure : existing.unitOfMeasure
  const spec = 'specifications' in body ? body.specifications : existing.specifications
  const target = 'targetPrice' in body ? Number(body.targetPrice) : Number(existing.targetPrice)
  const notes = 'notes' in body ? body.notes : existing.notes

  const upd = await pool.query(
    `UPDATE "RFQLine" SET
       description     = $1,
       quantity        = $2,
       "unitOfMeasure" = $3,
       specifications  = $4,
       "targetPrice"   = $5,
       notes           = $6,
       "updatedAt"     = NOW()
     WHERE id = $7 AND "rfqId" = $8 AND "organizationId" = $9
     RETURNING *`,
    [desc, qty, uom, spec, target, notes, lineId, id, g.organizationId]
  )

  await logProcurementEvent(pool, {
    organizationId: g.organizationId,
    eventType: 'RFQ_LINE_UPDATED',
    entityType: 'RFQ',
    entityId: id,
    actorId: g.userId,
    actorName: g.userName,
    summary: 'Updated line ' + existing.lineNumber,
    metadata: { lineId },
  })
  return NextResponse.json({ line: upd.rows[0] })
})

export const DELETE = procurementHandler(async (request: NextRequest, ctx: { params: { id: string; lineId: string } }) => {
  const g = await assertProcurement(request, 'WRITE')
  const { id, lineId } = ctx.params
  const chk = await assertDraftOwned(g.organizationId, id, lineId)
  if (!chk.ok) return NextResponse.json({ error: chk.error }, { status: chk.code })

  await pool.query(
    `DELETE FROM "RFQLine"
     WHERE id = $1 AND "rfqId" = $2 AND "organizationId" = $3`,
    [lineId, id, g.organizationId]
  )
  await logProcurementEvent(pool, {
    organizationId: g.organizationId,
    eventType: 'RFQ_LINE_REMOVED',
    entityType: 'RFQ',
    entityId: id,
    actorId: g.userId,
    actorName: g.userName,
    summary: 'Removed line ' + chk.line.lineNumber,
    metadata: { lineId },
  })
  return NextResponse.json({ ok: true })
})