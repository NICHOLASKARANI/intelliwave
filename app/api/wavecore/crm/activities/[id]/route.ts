export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

/**
 * GET /api/wavecore/crm/activities/[id]
 * Header + linked customer + linked lead + linked opportunity.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const orgId = session.organizationId

    const aRes = await pool.query(
      `SELECT a.*,
              c.name AS "customerName", c.email AS "customerEmail", c.phone AS "customerPhone",
              l.name AS "leadName", l.company AS "leadCompany",
              o.name AS "opportunityName", o.amount AS "opportunityAmount"
       FROM "Activity" a
       LEFT JOIN "Customer" c ON c.id = a."customerId"
       LEFT JOIN "Lead" l ON l.id = a."leadId"
       LEFT JOIN "Opportunity" o ON o.id = a."opportunityId"
       WHERE a.id = $1 AND a."organizationId" = $2`,
      [params.id, orgId]
    )
    if (aRes.rowCount === 0) {
      return NextResponse.json({ error: 'Activity not found' }, { status: 404 })
    }

    return NextResponse.json({ activity: aRes.rows[0] })
  } catch (error: any) {
    console.error('Activity GET-by-id error:', (error as Error).message)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * PATCH /api/wavecore/crm/activities/[id]
 * Editable: subject, description, type, dueDate, priority, completed,
 * customerId, leadId, opportunityId.
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

    const sets: string[] = []
    const values: any[] = []

    const textFields = ['subject', 'description', 'type', 'priority', 'customerId', 'leadId', 'opportunityId']
    for (const k of textFields) {
      if (k in body) {
        let v = body[k]
        if (k === 'subject' && !String(v || '').trim()) continue
        values.push(v === '' ? null : v)
        sets.push(`"${k}" = $${values.length}`)
      }
    }
    if ('dueDate' in body) {
      values.push(body.dueDate ? new Date(body.dueDate) : null)
      sets.push(`"dueDate" = $${values.length}`)
    }
    if ('completed' in body) {
      values.push(Boolean(body.completed))
      sets.push(`"completed" = $${values.length}`)
    }

    if (sets.length === 0) return NextResponse.json({ error: 'No editable fields' }, { status: 400 })
    sets.push(`"updatedAt" = NOW()`)

    values.push(params.id); const idP = values.length
    values.push(orgId);     const orgP = values.length

    const result = await pool.query(
      `UPDATE "Activity" SET ${sets.join(', ')}
       WHERE id = $${idP} AND "organizationId" = $${orgP}
       RETURNING *`,
      values
    )
    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'Activity not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, activity: result.rows[0] })
  } catch (error: any) {
    console.error('Activity PATCH error:', (error as Error).message)
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

    await pool.query(
      `DELETE FROM "Activity" WHERE id = $1 AND "organizationId" = $2`,
      [params.id, session.organizationId]
    )

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: 'Delete failed: ' + (error as Error).message }, { status: 500 })
  }
}