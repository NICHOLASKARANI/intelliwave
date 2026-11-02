export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/wavecore/auth'
import { pool } from '@/lib/wavecore/db'

const VALID_STATUSES = ['FREE', 'OCCUPIED', 'RESERVED', 'CLEANING']

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { status, name, capacity, location } = body

    const existing = await pool.query(
      'SELECT id FROM "RestaurantTable" WHERE id = $1 AND "organizationId" = $2',
      [params.id, session.organizationId]
    )
    if (existing.rows.length === 0) {
      return NextResponse.json({ error: 'Table not found' }, { status: 404 })
    }

    const updates: string[] = []
    const values: any[] = []
    let idx = 1

    if (status !== undefined) {
      if (!VALID_STATUSES.includes(status)) {
        return NextResponse.json({ error: `status must be one of: ${VALID_STATUSES.join(', ')}` }, { status: 400 })
      }
      updates.push(`status = $${idx++}`)
      values.push(status)
    }
    if (name !== undefined) {
      updates.push(`name = $${idx++}`)
      values.push(name.trim())
    }
    if (capacity !== undefined) {
      updates.push(`capacity = $${idx++}`)
      values.push(Number(capacity))
    }
    if (location !== undefined) {
      updates.push(`location = $${idx++}`)
      values.push(location?.trim() || null)
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    updates.push(`"updatedAt" = NOW()`)
    values.push(params.id)
    values.push(session.organizationId)

    await pool.query(
      `UPDATE "RestaurantTable" SET ${updates.join(', ')} WHERE id = $${idx} AND "organizationId" = $${idx + 1}`,
      values
    )

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('[tables/[id]] PATCH error:', err?.message)
    return NextResponse.json({ error: 'Failed to update table' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const result = await pool.query(
      'DELETE FROM "RestaurantTable" WHERE id = $1 AND "organizationId" = $2 RETURNING id',
      [params.id, session.organizationId]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Table not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('[tables/[id]] DELETE error:', err?.message)
    return NextResponse.json({ error: 'Failed to delete table' }, { status: 500 })
  }
}