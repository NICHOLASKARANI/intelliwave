export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'
import { guardHR } from '@/lib/wavecore/guard'

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // === PROJECTS RBAC GUARD ===
    const guard = await guardHR(request, 'HR_WRITE')
    if (guard.deny) return guard.response!
    // ===========================
    const body = await request.json()
    const sets: string[] = []
    const values: any[] = []
    let i = 1

    for (const k of ['description', 'employeeName']) {
      if (body[k] !== undefined) { sets.push(`"${k}" = $${i++}`); values.push(body[k] || null) }
    }
    if (body.hours !== undefined) { sets.push(`hours = $${i++}`); values.push(Number(body.hours || 0)) }
    if (body.billable !== undefined) { sets.push(`billable = $${i++}`); values.push(Boolean(body.billable)) }
    if (body.entryDate !== undefined) { sets.push(`"entryDate" = $${i++}`); values.push(body.entryDate) }

    if (sets.length === 0) return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
    values.push(params.id, session.organizationId)

    const result = await pool.query(
      `UPDATE "TimeEntry" SET ${sets.join(', ')}
       WHERE id = $${i++} AND "organizationId" = $${i} RETURNING *`,
      values
    )
    if (result.rowCount === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ entry: result.rows[0] })
  } catch (error) {
    console.error('TimeEntry PATCH error:', error)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // === PROJECTS RBAC GUARD ===
    const guard = await guardHR(request, 'HR_WRITE')
    if (guard.deny) return guard.response!
    // ===========================
    const result = await pool.query(
      `DELETE FROM "TimeEntry" WHERE id = $1 AND "organizationId" = $2`,
      [params.id, session.organizationId]
    )
    if (result.rowCount === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('TimeEntry DELETE error:', error)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}