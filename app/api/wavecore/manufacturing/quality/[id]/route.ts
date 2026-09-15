export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const qc = await pool.query(
      `SELECT * FROM "QualityCheck" WHERE id = $1 AND "organizationId" = $2`,
      [params.id, session.organizationId]
    )
    if (qc.rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    let workOrder = null
    if (qc.rows[0].workOrderId) {
      const wo = await pool.query(
        `SELECT id, number, "productId", status, quantity, "completedQty", priority
         FROM "WorkOrder"
         WHERE "organizationId" = $1 AND (id = $2 OR number = $2)
         LIMIT 1`,
        [session.organizationId, qc.rows[0].workOrderId]
      )
      workOrder = wo.rows[0] || null
    }

    return NextResponse.json({ check: qc.rows[0], workOrder })
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const sets: string[] = []
    const values: any[] = []
    let i = 1
    for (const key of ['type', 'result', 'notes', 'workOrderId']) {
      if (body[key] !== undefined) { sets.push(`"${key}" = $${i++}`); values.push(body[key]) }
    }
    for (const key of ['inspectedQty', 'passedQty', 'rejectedQty']) {
      if (body[key] !== undefined) { sets.push(`"${key}" = $${i++}`); values.push(Number(body[key])) }
    }
    if (sets.length === 0) return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })

    sets.push(`"updatedAt" = NOW()`)
    values.push(params.id, session.organizationId)

    const result = await pool.query(
      `UPDATE "QualityCheck" SET ${sets.join(', ')}
       WHERE id = $${i++} AND "organizationId" = $${i}
       RETURNING *`,
      values
    )
    if (result.rowCount === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ check: result.rows[0] })
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const result = await pool.query(
      `DELETE FROM "QualityCheck" WHERE id = $1 AND "organizationId" = $2`,
      [params.id, session.organizationId]
    )
    if (result.rowCount === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}