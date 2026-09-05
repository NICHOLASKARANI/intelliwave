export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/wavecore/auth'
import { pool } from '@/lib/wavecore/db'

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const result = await pool.query(`
      SELECT 
        p.*,
        COALESCE(sq.quantity, 0) as "stock_level"
      FROM "Product" p
      LEFT JOIN "StockQuantity" sq ON sq."productId" = p.id
      WHERE p."organizationId" = $1
      ORDER BY p."createdAt" DESC
      LIMIT 200
    `, [session.organizationId])

    return NextResponse.json({ products: result.rows })
  } catch (error) {
    console.error('Products GET error:', error)
    return NextResponse.json({ products: [] })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const crypto = require('crypto')
    const id = crypto.randomUUID()

    const result = await pool.query(`
      INSERT INTO "Product" (
        id, name, sku, barcode, description, category, unit,
        "costPrice", "sellingPrice", "minStock", "maxStock",
        "isActive", "isTracked", "trackSerial", "trackBatch",
        "organizationId", "createdAt", "updatedAt"
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW(), NOW())
      RETURNING *
    `, [
      id, body.name, body.sku || '', body.barcode || null, body.description || '',
      body.category || '', body.unit || 'pcs',
      Number(body.costPrice || 0), Number(body.sellingPrice || 0),
      Number(body.minStock || 10), Number(body.maxStock || 100),
      body.isActive !== false, body.isTracked !== false,
      body.trackSerial || false, body.trackBatch || false,
      session.organizationId
    ])

    if (body.initialStock && Number(body.initialStock) > 0) {
      const stockId = crypto.randomUUID()
      await pool.query(`
        INSERT INTO "StockQuantity" (id, quantity, "availableQty", "productId", "organizationId", "createdAt", "updatedAt")
        VALUES ($1, $2, $2, $3, $4, NOW(), NOW())
        ON CONFLICT ("productId", "organizationId") 
        DO UPDATE SET quantity = EXCLUDED.quantity, "availableQty" = EXCLUDED."availableQty", "updatedAt" = NOW()
      `, [stockId, Number(body.initialStock), id, session.organizationId]).catch(() => {})
    }

    return NextResponse.json({ product: result.rows[0], message: 'Product created' }, { status: 201 })
  } catch (error) {
    console.error('Products POST error:', error)
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) return NextResponse.json({ error: 'Product ID required' }, { status: 400 })

    await pool.query('DELETE FROM "StockQuantity" WHERE "productId" = $1', [id]).catch(() => {})
    const result = await pool.query('DELETE FROM "Product" WHERE id = $1 AND "organizationId" = $2', [id, session.organizationId])

    if (result.rowCount === 0) return NextResponse.json({ error: 'Product not found' }, { status: 404 })

    return NextResponse.json({ success: true, message: 'Product deleted' })
  } catch (error) {
    console.error('Products DELETE error:', error)
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
  }
}