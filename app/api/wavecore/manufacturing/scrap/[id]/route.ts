export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const result = await pool.query(
      `SELECT * FROM "ScrapRecord" WHERE id = $1 AND "organizationId" = $2`,
      [params.id, session.organizationId]
    )
    if (result.rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ record: result.rows[0] })
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

    for (const key of ['productName', 'workOrderNumber', 'reason', 'notes']) {
      if (body[key] !== undefined) { sets.push(`"${key}" = $${i++}`); values.push(body[key]) }
    }
    for (const key of ['quantity', 'unitCost']) {
      if (body[key] !== undefined) { sets.push(`"${key}" = $${i++}`); values.push(Number(body[key])) }
    }
    if (body.scrapDate !== undefined) { sets.push(`"scrapDate" = $${i++}`); values.push(body.scrapDate || new Date().toISOString()) }

    if (sets.length === 0) return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
    sets.push(`"updatedAt" = NOW()`)
    values.push(params.id, session.organizationId)

    const result = await pool.query(
      `UPDATE "ScrapRecord" SET ${sets.join(', ')}
       WHERE id = $${i++} AND "organizationId" = $${i}
       RETURNING *`,
      values
    )
    if (result.rowCount === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ record: result.rows[0] })
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const result = await pool.query(
      `DELETE FROM "ScrapRecord" WHERE id = $1 AND "organizationId" = $2`,
      [params.id, session.organizationId]
    )
    if (result.rowCount === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}