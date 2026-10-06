export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

/**
 * GET /api/wavecore/crm/opportunities/[id]
 * Returns header + customer snapshot + linked activities.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const orgId = session.organizationId

    const oRes = await pool.query(
      `SELECT o.*, c.name AS "customerName", c.email AS "customerEmail",
              c.phone AS "customerPhone", c.company AS "customerCompany"
       FROM "Opportunity" o
       LEFT JOIN "Customer" c ON c.id = o."customerId"
       WHERE o.id = $1 AND o."organizationId" = $2`,
      [params.id, orgId]
    )
    if (oRes.rowCount === 0) {
      return NextResponse.json({ error: 'Opportunity not found' }, { status: 404 })
    }
    const opportunity = oRes.rows[0]

    const activitiesRes = await pool.query(
      `SELECT id, type, subject, description, "dueDate", completed, "createdAt"
       FROM "Activity"
       WHERE "opportunityId" = $1 AND "organizationId" = $2
       ORDER BY "createdAt" DESC`,
      [params.id, orgId]
    ).catch(() => ({ rows: [] }))

    return NextResponse.json({
      opportunity,
      activities: activitiesRes.rows,
    })
  } catch (error: any) {
    console.error('Opportunity GET-by-id error:', (error as Error).message)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * PATCH /api/wavecore/crm/opportunities/[id]
 * Editable: name, amount, stage, probability, expectedCloseDate, notes, customerId.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const orgId = session.organizationId

    const body = await request.json().catch(() => null)
    if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })

    const allowed = ['name', 'amount', 'stage', 'probability', 'expectedCloseDate', 'notes', 'customerId', 'assignedToId']
    const sets: string[] = []
    const values: any[] = []
    for (const k of allowed) {
      if (k in body) {
        let v = body[k]
        if (k === 'amount') v = Number(v) || 0
        if (k === 'probability') v = Math.max(0, Math.min(100, parseInt(v) || 0))
        if (k === 'expectedCloseDate') v = v ? new Date(v) : null
        if (k === 'customerId') v = v || null
        if (k === 'notes') v = v ? String(v) : null
        if (k === 'assignedToId') v = v ? String(v) : null
        values.push(v)
        sets.push(`"${k}" = $${values.length}`)
      }
    }
    if (sets.length === 0) return NextResponse.json({ error: 'No editable fields' }, { status: 400 })
    sets.push(`"updatedAt" = NOW()`)

    values.push(params.id); const idP = values.length
    values.push(orgId);     const orgP = values.length

    const result = await pool.query(
      `UPDATE "Opportunity" SET ${sets.join(', ')}
       WHERE id = $${idP} AND "organizationId" = $${orgP}
       RETURNING *`,
      values
    )
    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'Opportunity not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, opportunity: result.rows[0] })
  } catch (error: any) {
    console.error('Opportunity PATCH error:', (error as Error).message)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const orgId = session.organizationId

    await pool.query(
      `DELETE FROM "Opportunity" WHERE id = $1 AND "organizationId" = $2`,
      [params.id, orgId]
    )

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: 'Delete failed: ' + (error as Error).message }, { status: 500 })
  }
}