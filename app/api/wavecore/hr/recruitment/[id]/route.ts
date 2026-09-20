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
    const jobRes = await pool.query(
      `SELECT * FROM "JobPosting" WHERE id = $1 AND "organizationId" = $2`,
      [params.id, session.organizationId]
    )
    if (jobRes.rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    const appRes = await pool.query(
      `SELECT * FROM "Applicant" WHERE "jobPostingId" = $1 AND "organizationId" = $2 ORDER BY "createdAt" DESC LIMIT 500`,
      [params.id, session.organizationId]
    )
    return NextResponse.json({ job: jobRes.rows[0], applicants: appRes.rows })
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
    for (const key of ['title', 'departmentId', 'positionId', 'employmentType', 'location', 'salaryRange', 'description', 'requirements', 'status', 'priority', 'hiringManagerId', 'closingDate']) {
      if (body[key] !== undefined) { sets.push(`"${key}" = $${i++}`); values.push(body[key] || null) }
    }
    if (sets.length === 0) return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
    sets.push(`"updatedAt" = NOW()`)
    values.push(params.id, session.organizationId)
    const result = await pool.query(
      `UPDATE "JobPosting" SET ${sets.join(', ')} WHERE id = $${i++} AND "organizationId" = $${i} RETURNING *`,
      values
    )
    if (result.rowCount === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ job: result.rows[0] })
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
    await pool.query(`DELETE FROM "Applicant" WHERE "jobPostingId" = $1 AND "organizationId" = $2`, [params.id, session.organizationId])
    const result = await pool.query(`DELETE FROM "JobPosting" WHERE id = $1 AND "organizationId" = $2`, [params.id, session.organizationId])
    if (result.rowCount === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ success: true })
  } catch { return NextResponse.json({ error: 'Failed' }, { status: 500 }) }
}