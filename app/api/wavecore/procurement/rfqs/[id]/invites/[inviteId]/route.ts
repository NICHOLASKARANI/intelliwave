export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { assertProcurement, logProcurementEvent, procurementHandler } from '@/lib/wavecore/procurement-guard'

const ALLOWED_STATUS = ['INVITED','RESPONDED','DECLINED','NO_RESPONSE']

export const PATCH = procurementHandler(async (request: NextRequest, ctx: { params: { id: string; inviteId: string } }) => {
  const g = await assertProcurement(request, 'WRITE')
  const { id, inviteId } = ctx.params

  let body: any
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }
  const status = String(body?.status || '').toUpperCase()
  if (!ALLOWED_STATUS.includes(status)) {
    return NextResponse.json({ error: 'status must be ' + ALLOWED_STATUS.join(' | ') }, { status: 400 })
  }

  const sets: string[] = ['status = $1', '"updatedAt" = NOW()']
  const values: any[] = [status]
  if (status === 'RESPONDED' || status === 'DECLINED') {
    sets.push(`"respondedAt" = NOW()`)
  }
  if ('notes' in body) {
    values.push(body.notes || null)
    sets.push(`notes = $${values.length}`)
  }
  values.push(inviteId); const invParam = values.length
  values.push(id); const rfqParam = values.length
  values.push(g.organizationId); const orgParam = values.length

  const upd = await pool.query(
    `UPDATE "RFQSupplierInvite" SET ${sets.join(', ')}
     WHERE id = $${invParam} AND "rfqId" = $${rfqParam} AND "organizationId" = $${orgParam}
     RETURNING *`,
    values
  )
  if (upd.rowCount === 0) return NextResponse.json({ error: 'Invite not found' }, { status: 404 })

  await logProcurementEvent(pool, {
    organizationId: g.organizationId,
    eventType: 'RFQ_INVITE_STATUS',
    entityType: 'RFQ',
    entityId: id,
    actorId: g.userId,
    actorName: g.userName,
    summary: 'Invite → ' + status,
    metadata: { inviteId, status },
  })
  return NextResponse.json({ invite: upd.rows[0] })
})

export const DELETE = procurementHandler(async (request: NextRequest, ctx: { params: { id: string; inviteId: string } }) => {
  const g = await assertProcurement(request, 'WRITE')
  const { id, inviteId } = ctx.params

  const cur = await pool.query(
    `SELECT status FROM "RFQ" WHERE id = $1 AND "organizationId" = $2`,
    [id, g.organizationId]
  )
  if (cur.rowCount === 0) return NextResponse.json({ error: 'RFQ not found' }, { status: 404 })
  if (!['DRAFT','PUBLISHED'].includes(cur.rows[0].status)) {
    return NextResponse.json({ error: 'Cannot remove invites in status ' + cur.rows[0].status }, { status: 409 })
  }

  await pool.query(
    `DELETE FROM "RFQSupplierInvite"
     WHERE id = $1 AND "rfqId" = $2 AND "organizationId" = $3`,
    [inviteId, id, g.organizationId]
  )

  await logProcurementEvent(pool, {
    organizationId: g.organizationId,
    eventType: 'RFQ_INVITE_REMOVED',
    entityType: 'RFQ',
    entityId: id,
    actorId: g.userId,
    actorName: g.userName,
    summary: 'Removed invite',
    metadata: { inviteId },
  })
  return NextResponse.json({ ok: true })
})