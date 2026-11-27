export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

const VALID_STATUSES = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'VERIFIED', 'CANCELLED']

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireTenant(req)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const res = await pool.query(
      `SELECT * FROM "HousekeepingTask" WHERE id = $1 AND "organizationId" = $2`,
      [params.id, session.organizationId])
    if (res.rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ task: res.rows[0] })
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireTenant(req)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { status, priority, assignedToId, assignedToName, notes, scheduledFor, roomType } = body || {}

    if (status && !VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    const sets: string[] = []
    const vals: any[] = []
    if (status)                        { vals.push(status);         sets.push(`status = $${vals.length}`) }
    if (priority)                      { vals.push(priority);       sets.push(`priority = $${vals.length}`) }
    if (assignedToId !== undefined)    { vals.push(assignedToId);   sets.push(`"assignedToId" = $${vals.length}`) }
    if (assignedToName !== undefined)  { vals.push(assignedToName); sets.push(`"assignedToName" = $${vals.length}`) }
    if (notes !== undefined)           { vals.push(notes);          sets.push(`notes = $${vals.length}`) }
    if (scheduledFor !== undefined)    { vals.push(scheduledFor);   sets.push(`"scheduledFor" = $${vals.length}::timestamp`) }
    if (roomType !== undefined)        { vals.push(roomType);       sets.push(`"roomType" = $${vals.length}`) }

    if (status === 'IN_PROGRESS') sets.push(`"startedAt" = COALESCE("startedAt", NOW())`)
    if (status === 'COMPLETED')   sets.push(`"completedAt" = NOW()`)
    if (status === 'VERIFIED')    { sets.push(`"verifiedAt" = NOW()`); sets.push(`"verifiedBy" = '${session.userId}'`) }

    if (sets.length === 0) return NextResponse.json({ error: 'No fields to update' }, { status: 400 })

    sets.push(`"updatedAt" = NOW()`)
    vals.push(params.id); vals.push(session.organizationId)

    const res = await pool.query(
      `UPDATE "HousekeepingTask" SET ${sets.join(', ')}
       WHERE id = $${vals.length - 1} AND "organizationId" = $${vals.length}
       RETURNING *`, vals)

    if (res.rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ task: res.rows[0] })
  } catch (error: any) {
    console.error('[hk PATCH]', error?.message)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireTenant(req)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const res = await pool.query(
      `DELETE FROM "HousekeepingTask" WHERE id = $1 AND "organizationId" = $2 RETURNING id`,
      [params.id, session.organizationId])
    if (res.rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}