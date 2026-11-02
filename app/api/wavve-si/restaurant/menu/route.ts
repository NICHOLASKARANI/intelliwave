export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/wavecore/auth'
import { pool } from '@/lib/wavecore/db'

// POST /api/wavve-si/restaurant/menu
// Body: { name, sku, category, sellingPrice, costPrice?, unit?, description? }
// Creates a new Product scoped to the authenticated org.
export async function POST(request: NextRequest) {
  const client = await pool.connect()
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { name, sku, category, sellingPrice, costPrice = 0, unit = 'Unit', description = '' } = body

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Product name is required' }, { status: 400 })
    }
    if (sellingPrice === undefined || sellingPrice === null || isNaN(Number(sellingPrice))) {
      return NextResponse.json({ error: 'Selling price is required and must be a number' }, { status: 400 })
    }

    // Generate SKU if not provided
    const finalSku = sku && sku.trim() ? sku.trim() : `SKU-${Date.now()}-${Math.floor(Math.random() * 1000)}`

    // Check SKU uniqueness within org
    const existing = await pool.query(
      'SELECT id FROM "Product" WHERE sku = $1 AND "organizationId" = $2',
      [finalSku, session.organizationId]
    )
    if (existing.rows.length > 0) {
      return NextResponse.json({ error: 'SKU already exists in your organization' }, { status: 409 })
    }

    await client.query('BEGIN')

    const productId = 'c' + Math.random().toString(36).slice(2, 24)

    await client.query(
      `INSERT INTO "Product" (id, name, sku, category, "sellingPrice", "costPrice", unit, description, "isActive", "isTracked", "organizationId", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, true, $9, NOW(), NOW())`,
      [
        productId,
        name.trim(),
        finalSku,
        category || null,
        Number(sellingPrice),
        Number(costPrice),
        unit || 'Unit',
        description || null,
        session.organizationId,
      ]
    )

    await client.query('COMMIT')

    const result = await pool.query(
      'SELECT id, name, sku, category, "sellingPrice", "costPrice", unit, description, "isActive", "createdAt" FROM "Product" WHERE id = $1',
      [productId]
    )

    return NextResponse.json({ success: true, product: result.rows[0] }, { status: 201 })
  } catch (err: any) {
    await client.query('ROLLBACK').catch(() => {})
    console.error('[wavve-si/restaurant/menu] POST error:', err?.message)
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 })
  } finally {
    client.release()
  }
}