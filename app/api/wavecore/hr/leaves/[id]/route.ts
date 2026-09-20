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
    const result = await pool.query(
      `SELECT * FROM "LeaveRequest" WHERE id = $1 AND "organizationId" = $2`,
      [params.id, session.organizationId]
    )
    if (result.rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ leave: result.rows[0] })
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
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

    for (const key of ['status', 'reason', 'rejectionReason', 'employeeId', 'leaveTypeId']) {
      if (body[key] !== undefined) { sets.push(`"${key}" = $${i++}`); values.push(body[key] || null) }
    }
    for (const key of ['startDate', 'endDate']) {
      if (body[key] !== undefined) { sets.push(`"${key}" = $${i++}`); values.push(body[key]) }
    }
    if (body.days !== undefined) { sets.push(`days = $${i++}`); values.push(Number(body.days || 0)) }

    // If approving, stamp approvedAt + approvedById
    if (body.status === 'APPROVED') {
      sets.push(`"approvedAt" = NOW()`)
      sets.push(`"approvedById" = $${i++}`)
      values.push(session.userId || null)
    }

    if (sets.length === 0) return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
    sets.push(`"updatedAt" = NOW()`)
    values.push(params.id, session.organizationId)

    const result = await pool.query(
      `UPDATE "LeaveRequest" SET ${sets.join(', ')}
       WHERE id = $${i++} AND "organizationId" = $${i}
       RETURNING *`,
      values
    )
    if (result.rowCount === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ leave: result.rows[0] })
  } catch (error) {
    console.error('[HR-ERROR]', error); return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
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
      `DELETE FROM "LeaveRequest" WHERE id = $1 AND "organizationId" = $2`,
      [params.id, session.organizationId]
    )
    if (result.rowCount === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}