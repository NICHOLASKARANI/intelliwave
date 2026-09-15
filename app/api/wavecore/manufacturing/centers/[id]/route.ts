export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const wcRes = await pool.query(
      `SELECT * FROM "WorkCenter" WHERE id = $1 AND "organizationId" = $2`,
      [params.id, session.organizationId]
    )
    if (wcRes.rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    const wc = wcRes.rows[0]

    const woRes = await pool.query(
      `SELECT id, number, "productId", status, quantity, "completedQty", priority, "endDate", "createdAt"
       FROM "WorkOrder"
       WHERE "organizationId" = $1
         AND ("workCenterId" = $2 OR "workCenterId" = $3)
       ORDER BY "createdAt" DESC`,
      [session.organizationId, params.id, wc.name]
    )

    return NextResponse.json({ center: wc, workOrders: woRes.rows })
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

    if (body.name !== undefined) { sets.push(`"name" = $${i++}`); values.push(body.name) }
    if (body.code !== undefined) { sets.push(`"code" = $${i++}`); values.push(body.code) }
    if (body.description !== undefined) { sets.push(`"description" = $${i++}`); values.push(body.description) }
    if (body.capacity !== undefined) { sets.push(`"capacity" = $${i++}`); values.push(Number(body.capacity)) }
    if (body.efficiency !== undefined) { sets.push(`"efficiency" = $${i++}`); values.push(Number(body.efficiency) / 100) }
    if (body.costPerHour !== undefined) { sets.push(`"costPerHour" = $${i++}`); values.push(Number(body.costPerHour)) }

    if (sets.length === 0) return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })

    sets.push(`"updatedAt" = NOW()`)
    values.push(params.id, session.organizationId)

    const result = await pool.query(
      `UPDATE "WorkCenter" SET ${sets.join(', ')}
       WHERE id = $${i++} AND "organizationId" = $${i}
       RETURNING *`,
      values
    )
    if (result.rowCount === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ center: result.rows[0] })
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const wc = await pool.query(
      `SELECT name FROM "WorkCenter" WHERE id = $1 AND "organizationId" = $2`,
      [params.id, session.organizationId]
    )
    if (wc.rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const open = await pool.query(
      `SELECT COUNT(*)::int AS c FROM "WorkOrder"
       WHERE "organizationId" = $1
         AND ("workCenterId" = $2 OR "workCenterId" = $3)
         AND status NOT IN ('COMPLETED', 'CANCELLED')`,
      [session.organizationId, params.id, wc.rows[0].name]
    )
    if (open.rows[0].c > 0) {
      return NextResponse.json({
        error: 'Cannot delete: ' + open.rows[0].c + ' open work order(s) still assigned to this center'
      }, { status: 400 })
    }

    await pool.query(
      `DELETE FROM "WorkCenter" WHERE id = $1 AND "organizationId" = $2`,
      [params.id, session.organizationId]
    )
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}