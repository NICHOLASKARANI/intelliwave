export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const lRes = await pool.query(
      `SELECT l.*, c.name AS "convertedCustomerName"
       FROM "Lead" l
       LEFT JOIN "Customer" c ON c.id = l."customerId"
       WHERE l.id = $1 AND l."organizationId" = $2`,
      [params.id, session.organizationId]
    )
    if (lRes.rows.length === 0) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }
    const lead = lRes.rows[0]

    // Linked activities (all activities for this lead)
    const activitiesRes = await pool.query(
      `SELECT id, type, subject, description, "dueDate", completed, "createdAt"
       FROM "Activity"
       WHERE "leadId" = $1 AND "organizationId" = $2
       ORDER BY "createdAt" DESC`,
      [params.id, session.organizationId]
    ).catch(() => ({ rows: [] }))

    // Linked opportunities (via customer, if converted)
    const oppsRes = lead.customerId
      ? await pool.query(
          `SELECT id, name, amount, stage, probability, "expectedCloseDate", "createdAt"
           FROM "Opportunity"
           WHERE "customerId" = $1 AND "organizationId" = $2
           ORDER BY "createdAt" DESC`,
          [lead.customerId, session.organizationId]
        ).catch(() => ({ rows: [] }))
      : { rows: [] }

    return NextResponse.json({
      lead,
      activities: activitiesRes.rows,
      opportunities: oppsRes.rows,
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json().catch(() => null)
    if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })

    const allowed = ['name', 'email', 'phone', 'company', 'source', 'status', 'priority', 'notes', 'score']
    const sets: string[] = []
    const values: any[] = []
    for (const k of allowed) {
      if (k in body) {
        let v = body[k]
        if (k === 'name' && !String(v || '').trim()) continue
        if (k === 'score') v = Number(v) || 0
        if (k === 'notes') v = v ? String(v) : null
        values.push(v === '' ? null : v)
        sets.push(`"${k}" = $${values.length}`)
      }
    }
    if (sets.length === 0) return NextResponse.json({ error: 'No editable fields' }, { status: 400 })
    sets.push(`"updatedAt" = NOW()`)

    values.push(params.id); const idP = values.length
    values.push(session.organizationId); const orgP = values.length

    const result = await pool.query(
      `UPDATE "Lead" SET ${sets.join(', ')}
       WHERE id = $${idP} AND "organizationId" = $${orgP}
       RETURNING *`,
      values
    )
    if (result.rowCount === 0) return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    return NextResponse.json({ success: true, lead: result.rows[0] })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, ctx: { params: { id: string } }) {
  // Keep existing PUT semantics working.
  return PATCH(request, ctx)
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const result = await pool.query(
      'DELETE FROM "Lead" WHERE id = $1 AND "organizationId" = $2',
      [params.id, session.organizationId]
    )
    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}