export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/wavecore/auth'
import { pool } from '@/lib/wavecore/db'

// GET /api/wavve-si/restaurant/menu/[id]
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const result = await pool.query(
      `SELECT id, name, sku, category, "sellingPrice", "costPrice", unit, description, "isActive", "createdAt", "updatedAt"
       FROM "Product"
       WHERE id = $1 AND "organizationId" = $2`,
      [params.id, session.organizationId]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    return NextResponse.json({ product: result.rows[0] })
  } catch (err: any) {
    console.error('[wavve-si/restaurant/menu/[id]] GET error:', err?.message)
    return NextResponse.json({ error: 'Failed to load product' }, { status: 500 })
  }
}

// PATCH /api/wavve-si/restaurant/menu/[id]
// Body: { name?, category?, sellingPrice?, costPrice?, unit?, description?, isActive? }
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()

    // Verify exists and belongs to org
    const existing = await pool.query(
      'SELECT id FROM "Product" WHERE id = $1 AND "organizationId" = $2',
      [params.id, session.organizationId]
    )
    if (existing.rows.length === 0) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
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
    if (body.category !== undefined) {
      updates.push(`category = $${idx++}`)
      values.push(body.category || null)
    }
    if (body.sellingPrice !== undefined) {
      if (isNaN(Number(body.sellingPrice))) {
        return NextResponse.json({ error: 'Selling price must be a number' }, { status: 400 })
      }
      updates.push(`"sellingPrice" = $${idx++}`)
      values.push(Number(body.sellingPrice))
    }
    if (body.costPrice !== undefined) {
      updates.push(`"costPrice" = $${idx++}`)
      values.push(Number(body.costPrice))
    }
    if (body.unit !== undefined) {
      updates.push(`unit = $${idx++}`)
      values.push(body.unit || 'Unit')
    }
    if (body.description !== undefined) {
      updates.push(`description = $${idx++}`)
      values.push(body.description || null)
    }
    if (body.isActive !== undefined) {
      updates.push(`"isActive" = $${idx++}`)
      values.push(Boolean(body.isActive))
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    updates.push(`"updatedAt" = NOW()`)
    values.push(params.id)
    values.push(session.organizationId)

    await pool.query(
      `UPDATE "Product" SET ${updates.join(', ')} WHERE id = $${idx} AND "organizationId" = $${idx + 1}`,
      values
    )

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('[wavve-si/restaurant/menu/[id]] PATCH error:', err?.message)
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 })
  }
}

// DELETE /api/wavve-si/restaurant/menu/[id]
// Soft-deletes (sets isActive=false) — products are never hard-deleted to preserve order history.
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const result = await pool.query(
      `UPDATE "Product" SET "isActive" = false, "updatedAt" = NOW()
       WHERE id = $1 AND "organizationId" = $2
       RETURNING id`,
      [params.id, session.organizationId]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('[wavve-si/restaurant/menu/[id]] DELETE error:', err?.message)
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 })
  }
}