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

    for (const k of ['title', 'description', 'dueDate']) {
      if (body[k] !== undefined) { sets.push(`"${k}" = $${i++}`); values.push(body[k] || null) }
    }
    if (body.completed !== undefined) { sets.push(`completed = $${i++}`); values.push(Boolean(body.completed)) }

    if (sets.length === 0) return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
    values.push(params.id, session.organizationId)

    const result = await pool.query(
      `UPDATE "Milestone" SET ${sets.join(', ')}
       WHERE id = $${i++} AND "organizationId" = $${i} RETURNING *`,
      values
    )
    if (result.rowCount === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ milestone: result.rows[0] })
  } catch (error) {
    console.error('Milestone PATCH error:', error)
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
      `DELETE FROM "Milestone" WHERE id = $1 AND "organizationId" = $2`,
      [params.id, session.organizationId]
    )
    if (result.rowCount === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Milestone DELETE error:', error)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}