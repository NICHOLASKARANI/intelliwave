export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { assertProcurement, logProcurementEvent, procurementHandler } from '@/lib/wavecore/procurement-guard'

const ALLOWED: Record<string, { from: string[]; to: string }> = {
  SIGN:      { from: ['DRAFT'],                to: 'DRAFT' },       // sets signedAt, stays DRAFT
  ACTIVATE:  { from: ['DRAFT'],                to: 'ACTIVE' },
  SUSPEND:   { from: ['ACTIVE'],               to: 'SUSPENDED' },
  RESUME:    { from: ['SUSPENDED'],            to: 'ACTIVE' },
  TERMINATE: { from: ['ACTIVE','SUSPENDED'],   to: 'TERMINATED' },
  EXPIRE:    { from: ['ACTIVE','SUSPENDED'],   to: 'EXPIRED' },
}

/**
 * POST /api/wavecore/procurement/contracts/[id]/lifecycle
 * Body: { action: 'SIGN'|'ACTIVATE'|'SUSPEND'|'RESUME'|'TERMINATE'|'EXPIRE', reason? }
 */
export const POST = procurementHandler(async (request: NextRequest, ctx: { params: { id: string } }) => {
  const g = await assertProcurement(request, 'WRITE')
  const id = ctx.params.id

  let body: any
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const action = String(body?.action || '').toUpperCase()
  if (!Object.keys(ALLOWED).includes(action)) {
    return NextResponse.json({ error: 'action must be SIGN | ACTIVATE | SUSPEND | RESUME | TERMINATE | EXPIRE' }, { status: 400 })
  }

  const cur = await pool.query(
    `SELECT * FROM "SupplierContract" WHERE id = $1 AND "organizationId" = $2`,
    [id, g.organizationId]
  )
  if (cur.rowCount === 0) return NextResponse.json({ error: 'Contract not found' }, { status: 404 })
  const c = cur.rows[0]
  if (!ALLOWED[action].from.includes(c.status)) {
    return NextResponse.json({ error: `Cannot ${action} contract in status ${c.status}` }, { status: 409 })
  }

  const to = ALLOWED[action].to
  const sets: string[] = ['status = $1', '"updatedAt" = NOW()']
  const values: any[] = [to]

  if (action === 'SIGN') {
    sets.push(`"signedAt" = NOW()`)
    values.push(g.userId); sets.push(`"signedBy" = $${values.length}`)
    values.push(g.userName); sets.push(`"signedByName" = $${values.length}`)
  } else if (action === 'TERMINATE' || action === 'EXPIRE') {
    if (body?.reason) {
      values.push(String(body.reason).slice(0, 2000))
      sets.push(`notes = COALESCE(notes, '') || E'\n[' || $${values.length} || ']'`)
    }
  }

  values.push(id); const idParam = values.length
  values.push(g.organizationId); const orgParam = values.length

  const upd = await pool.query(
    `UPDATE "SupplierContract" SET ${sets.join(', ')}
     WHERE id = $${idParam} AND "organizationId" = $${orgParam}
     RETURNING *`,
    values
  )

  const eventType =
    action === 'SIGN'      ? 'SUPPLIER_CONTRACT_SIGNED'
    : action === 'ACTIVATE'  ? 'SUPPLIER_CONTRACT_ACTIVATED'
    : action === 'SUSPEND'   ? 'SUPPLIER_CONTRACT_SUSPENDED'
    : action === 'RESUME'    ? 'SUPPLIER_CONTRACT_RESUMED'
    : action === 'TERMINATE' ? 'SUPPLIER_CONTRACT_TERMINATED'
    :                          'SUPPLIER_CONTRACT_EXPIRED'

  await logProcurementEvent(pool, {
    organizationId: g.organizationId,
    eventType,
    entityType: 'SupplierContract',
    entityId: id,
    actorId: g.userId,
    actorName: g.userName,
    summary: action + ' ' + c.contractNumber,
    metadata: { reason: body?.reason || null, fromStatus: c.status, toStatus: to },
  })

  return NextResponse.json({ ok: true, contract: upd.rows[0] })
})