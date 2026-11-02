export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/wavecore/auth'
import { pool } from '@/lib/wavecore/db'

// GET /api/wavve-si/restaurant/customers/[id]
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const result = await pool.query(
      `SELECT id, name, email, phone, company, address, city, country, notes, status, "createdAt", "updatedAt"
       FROM "Customer"
       WHERE id = $1 AND "organizationId" = $2`,
      [params.id, session.organizationId]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    return NextResponse.json({ customer: result.rows[0] })
  } catch (err: any) {
    console.error('[wavve-si/restaurant/customers/[id]] GET error:', err?.message)
    return NextResponse.json({ error: 'Failed to load customer' }, { status: 500 })
  }
}

// PATCH /api/wavve-si/restaurant/customers/[id]
// Body: { name?, email?, phone?, company?, city?, country?, notes?, status? }
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()

    // Verify exists and belongs to org
    const existing = await pool.query(
      'SELECT id FROM "Customer" WHERE id = $1 AND "organizationId" = $2',
      [params.id, session.organizationId]
    )
    if (existing.rows.length === 0) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    // Build dynamic update
    const updates: string[] = []
    const values: any[] = []
    let idx = 1

    if (body.name !== undefined) {
      if (typeof body.name !== 'string' || body.name.trim().length === 0) {
        return NextResponse.json({ error: 'Name cannot be empty' }, { status: 400 })
      }
      updates.push(`name = $${idx++}`)
      values.push(body.name.trim())
    }
    if (body.email !== undefined) {
      updates.push(`email = $${idx++}`)
      values.push(body.email?.trim() || null)
    }
    if (body.phone !== undefined) {
      updates.push(`phone = $${idx++}`)
      values.push(body.phone?.trim() || null)
    }
    if (body.company !== undefined) {
      updates.push(`company = $${idx++}`)
      values.push(body.company?.trim() || null)
    }
    if (body.city !== undefined) {
      updates.push(`city = $${idx++}`)
      values.push(body.city?.trim() || null)
    }
    if (body.country !== undefined) {
      updates.push(`country = $${idx++}`)
      values.push(body.country?.trim() || null)
    }
    if (body.notes !== undefined) {
      updates.push(`notes = $${idx++}`)
      values.push(body.notes?.trim() || null)
    }
    if (body.status !== undefined) {
      const valid = ['ACTIVE', 'INACTIVE', 'PROSPECT', 'BLOCKED']
      if (!valid.includes(body.status)) {
        return NextResponse.json({ error: `status must be one of: ${valid.join(', ')}` }, { status: 400 })
      }
      updates.push(`status = $${idx++}`)
      values.push(body.status)
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    updates.push(`"updatedAt" = NOW()`)
    values.push(params.id)
    values.push(session.organizationId)

    await pool.query(
      `UPDATE "Customer" SET ${updates.join(', ')} WHERE id = $${idx} AND "organizationId" = $${idx + 1}`,
      values
    )

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('[wavve-si/restaurant/customers/[id]] PATCH error:', err?.message)
    return NextResponse.json({ error: 'Failed to update customer' }, { status: 500 })
  }
}

// DELETE /api/wavve-si/restaurant/customers/[id]
// Soft-deletes by setting status to INACTIVE. Preserves order history.
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const result = await pool.query(
      `UPDATE "Customer" SET status = 'INACTIVE', "updatedAt" = NOW()
       WHERE id = $1 AND "organizationId" = $2
       RETURNING id`,
      [params.id, session.organizationId]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('[wavve-si/restaurant/customers/[id]] DELETE error:', err?.message)
    return NextResponse.json({ error: 'Failed to delete customer' }, { status: 500 })
  }
}