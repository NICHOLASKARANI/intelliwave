export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { assertProcurement, logProcurementEvent, procurementHandler } from '@/lib/wavecore/procurement-guard'

const ALLOWED: Record<string, { from: string[]; to: string }> = {
  PUBLISH: { from: ['DRAFT'],                       to: 'PUBLISHED' },
  CLOSE:   { from: ['PUBLISHED'],                   to: 'CLOSED' },
  AWARD:   { from: ['PUBLISHED','CLOSED'],          to: 'AWARDED' },
  CANCEL:  { from: ['DRAFT','PUBLISHED','CLOSED'],  to: 'CANCELLED' },
}

/**
 * POST /api/wavecore/procurement/rfqs/[id]/lifecycle
 * Body: { action: 'PUBLISH'|'CLOSE'|'AWARD'|'CANCEL', awardedSupplierId?, reason? }
 */
export const POST = procurementHandler(async (request: NextRequest, ctx: { params: { id: string } }) => {
  const g = await assertProcurement(request, 'WRITE')
  const id = ctx.params.id

  let body: any
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }
  const action = String(body?.action || '').toUpperCase()
  if (!Object.keys(ALLOWED).includes(action)) {
    return NextResponse.json({ error: 'action must be PUBLISH | CLOSE | AWARD | CANCEL' }, { status: 400 })
  }

  const cur = await pool.query(
    `SELECT * FROM "RFQ" WHERE id = $1 AND "organizationId" = $2`,
    [id, g.organizationId]
  )
  if (cur.rowCount === 0) return NextResponse.json({ error: 'RFQ not found' }, { status: 404 })
  const rfq = cur.rows[0]
  if (!ALLOWED[action].from.includes(rfq.status)) {
    return NextResponse.json({ error: `Cannot ${action} RFQ in status ${rfq.status}` }, { status: 409 })
  }

  // Action-specific guards
  if (action === 'PUBLISH') {
    const inviteCheck = await pool.query(
      `SELECT COUNT(*)::int AS n FROM "RFQSupplierInvite"
       WHERE "rfqId" = $1 AND "organizationId" = $2`,
      [id, g.organizationId]
    )
    if ((inviteCheck.rows[0]?.n || 0) === 0) {
      return NextResponse.json({ error: 'Cannot publish RFQ with no supplier invites' }, { status: 400 })
    }
  }
  if (action === 'AWARD') {
    const awardedSupplierId = String(body?.awardedSupplierId || '').trim()
    if (!awardedSupplierId) {
      return NextResponse.json({ error: 'awardedSupplierId required for AWARD' }, { status: 400 })
    }
    const q = await pool.query(
      `SELECT COUNT(*)::int AS n FROM "SupplierQuoteExt"
       WHERE "rfqId" = $1 AND "supplierId" = $2 AND "organizationId" = $3`,
      [id, awardedSupplierId, g.organizationId]
    )
    if ((q.rows[0]?.n || 0) === 0) {
      return NextResponse.json({ error: 'Awarded supplier has no quotes on this RFQ' }, { status: 400 })
    }
    // Accept all their quotes, reject others
    await pool.query(
      `UPDATE "SupplierQuoteExt"
       SET status = CASE WHEN "supplierId" = $1 THEN 'ACCEPTED' ELSE 'REJECTED' END,
           "updatedAt" = NOW()
       WHERE "rfqId" = $2 AND "organizationId" = $3`,
      [awardedSupplierId, id, g.organizationId]
    )
  }

  const to = ALLOWED[action].to
  const sets: string[] = ['status = $1', '"updatedAt" = NOW()']
  const values: any[] = [to]

  if (action === 'PUBLISH') {
    sets.push(`"publishedAt" = NOW()`)
  } else if (action === 'AWARD') {
    sets.push(`"awardedAt" = NOW()`)
    values.push(String(body.awardedSupplierId))
    sets.push(`"awardedBidId" = $${values.length}`)
  } else if (action === 'CANCEL' && body?.reason) {
    values.push(String(body.reason).slice(0, 2000))
    sets.push(`notes = COALESCE(notes, '') || E'\n[CANCEL] ' || $${values.length}`)
  }

  values.push(id); const idParam = values.length
  values.push(g.organizationId); const orgParam = values.length

  const upd = await pool.query(
    `UPDATE "RFQ" SET ${sets.join(', ')}
     WHERE id = $${idParam} AND "organizationId" = $${orgParam}
     RETURNING *`,
    values
  )

  const eventType = {
    PUBLISH: 'RFQ_PUBLISHED',
    CLOSE:   'RFQ_CLOSED',
    AWARD:   'RFQ_AWARDED',
    CANCEL:  'RFQ_CANCELLED',
  }[action] || 'RFQ_STATUS_CHANGED'

  await logProcurementEvent(pool, {
    organizationId: g.organizationId,
    eventType,
    entityType: 'RFQ',
    entityId: id,
    actorId: g.userId,
    actorName: g.userName,
    summary: action + ' ' + rfq.rfqNumber,
    metadata: { fromStatus: rfq.status, toStatus: to, awardedSupplierId: body?.awardedSupplierId || null },
  })

  return NextResponse.json({ ok: true, rfq: upd.rows[0] })
})