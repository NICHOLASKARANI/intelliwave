export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'
import { guardHR } from '@/lib/wavecore/guard'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // === RBAC GUARD (wave 2) ===
    const guard = await guardHR(request, 'HR_WRITE')
    if (guard.deny) return guard.response!
    // ============================
    const res = await pool.query(
      `SELECT * FROM "TrainingProgram" WHERE id = $1 AND "organizationId" = $2`,
      [params.id, session.organizationId]
    )
    if (res.rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ training: res.rows[0] })
  } catch { return NextResponse.json({ error: 'Failed' }, { status: 500 }) }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // === RBAC GUARD (wave 2) ===
    const guard = await guardHR(request, 'HR_WRITE')
    if (guard.deny) return guard.response!
    // ============================
    const body = await request.json()
    const sets: string[] = []
    const values: any[] = []
    let i = 1
    for (const k of ['title','category','provider','trainer','description','startDate','endDate','status']) {
      if (body[k] !== undefined) { sets.push(`"${k}" = $${i++}`); values.push(body[k] || null) }
    }
    for (const k of ['durationHours','costPerAttendee','maxAttendees','enrolledCount']) {
      if (body[k] !== undefined) { sets.push(`"${k}" = $${i++}`); values.push(Number(body[k] || 0)) }
    }
    if (sets.length === 0) return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
    sets.push(`"updatedAt" = NOW()`)
    values.push(params.id, session.organizationId)
    const result = await pool.query(
      `UPDATE "TrainingProgram" SET ${sets.join(', ')} WHERE id = $${i++} AND "organizationId" = $${i} RETURNING *`,
      values
    )
    if (result.rowCount === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ training: result.rows[0] })
  } catch (error) { console.error('[HR-ERROR]', error); return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 }) }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // === RBAC GUARD (wave 2) ===
    const guard = await guardHR(request, 'HR_WRITE')
    if (guard.deny) return guard.response!
    // ============================
    const result = await pool.query(
      `DELETE FROM "TrainingProgram" WHERE id = $1 AND "organizationId" = $2`,
      [params.id, session.organizationId]
    )
    if (result.rowCount === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ success: true })
  } catch { return NextResponse.json({ error: 'Failed' }, { status: 500 }) }
}