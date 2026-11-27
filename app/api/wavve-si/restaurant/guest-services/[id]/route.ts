export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

const VALID_STATUSES = ['OPEN', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireTenant(req)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const res = await pool.query(
      `SELECT * FROM "GuestServiceRequest" WHERE id = $1 AND "organizationId" = $2`,
      [params.id, session.organizationId])
    if (res.rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ request: res.rows[0] })
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireTenant(req)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { status, priority, category, assignedToId, assignedToName, description, resolutionNotes } = body || {}

    if (status && !VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    const sets: string[] = []
    const vals: any[] = []
    if (status)                        { vals.push(status);          sets.push(`status = $${vals.length}`) }
    if (priority)                      { vals.push(priority);        sets.push(`priority = $${vals.length}`) }
    if (category)                      { vals.push(category);        sets.push(`category = $${vals.length}`) }
    if (assignedToId !== undefined)    { vals.push(assignedToId);    sets.push(`"assignedToId" = $${vals.length}`) }
    if (assignedToName !== undefined)  { vals.push(assignedToName);  sets.push(`"assignedToName" = $${vals.length}`) }
    if (description !== undefined)     { vals.push(description);     sets.push(`description = $${vals.length}`) }
    if (resolutionNotes !== undefined) { vals.push(resolutionNotes); sets.push(`"resolutionNotes" = $${vals.length}`) }

    if (status === 'RESOLVED') sets.push(`"resolvedAt" = NOW()`)
    if (status === 'CLOSED')   sets.push(`"closedAt" = NOW()`)

    if (sets.length === 0) return NextResponse.json({ error: 'No fields to update' }, { status: 400 })

    sets.push(`"updatedAt" = NOW()`)
    vals.push(params.id); vals.push(session.organizationId)

    const res = await pool.query(
      `UPDATE "GuestServiceRequest" SET ${sets.join(', ')}
       WHERE id = $${vals.length - 1} AND "organizationId" = $${vals.length}
       RETURNING *`, vals)

    if (res.rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ request: res.rows[0] })
  } catch (error: any) {
    console.error('[gsr PATCH]', error?.message)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireTenant(req)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const res = await pool.query(
      `DELETE FROM "GuestServiceRequest" WHERE id = $1 AND "organizationId" = $2 RETURNING id`,
      [params.id, session.organizationId])
    if (res.rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}