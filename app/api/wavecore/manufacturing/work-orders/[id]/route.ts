export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const wo = await pool.query(
      `SELECT wo.*, p.name AS "productName", p.sku AS "productSku",
              wc.name AS "workCenterName", b.name AS "bomName"
       FROM "WorkOrder" wo
       LEFT JOIN "Product" p ON p.id = wo."productId"
       LEFT JOIN "WorkCenter" wc ON wc.id = wo."workCenterId"
       LEFT JOIN "BillOfMaterial" b ON b.id = wo."bomId"
       WHERE wo.id = $1 AND wo."organizationId" = $2`,
      [params.id, session.organizationId]
    )
    if (wo.rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    let components: any[] = []
    if (wo.rows[0].bomId) {
      const c = await pool.query(
        `SELECT bc.*, p.name AS "componentName", p.sku AS "componentSku"
         FROM "BOMComponent" bc
         LEFT JOIN "Product" p ON p.id = bc."productId"
         WHERE bc."bomId" = $1`,
        [wo.rows[0].bomId]
      )
      components = c.rows
    }

    return NextResponse.json({ workOrder: wo.rows[0], components })
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const allowed = ['status', 'quantity', 'completedQty', 'priority', 'notes', 'startDate', 'endDate', 'workCenterId', 'bomId']
    const sets: string[] = []
    const values: any[] = []
    let i = 1

    for (const key of allowed) {
      if (body[key] !== undefined) {
        sets.push(`"${key}" = $${i++}`)
        values.push(body[key])
      }
    }
    if (sets.length === 0) return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })

    sets.push(`"updatedAt" = NOW()`)
    values.push(params.id, session.organizationId)

    const result = await pool.query(
      `UPDATE "WorkOrder" SET ${sets.join(', ')}
       WHERE id = $${i++} AND "organizationId" = $${i}
       RETURNING *`,
      values
    )
    if (result.rowCount === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ workOrder: result.rows[0] })
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const result = await pool.query(
      `DELETE FROM "WorkOrder" WHERE id = $1 AND "organizationId" = $2`,
      [params.id, session.organizationId]
    )
    if (result.rowCount === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}