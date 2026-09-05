export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/wavecore/auth'
import { pool } from '@/lib/wavecore/db'

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const result = await pool.query(`
      SELECT sm.*, p.name as "productName", p.sku
      FROM "StockMove" sm
      LEFT JOIN "Product" p ON p.id = sm."productId"
      WHERE sm."organizationId" = $1
      ORDER BY sm."createdAt" DESC LIMIT 200
    `, [session.organizationId]).catch(() => ({ rows: [] }))

    return NextResponse.json({ movements: result.rows })
  } catch (error) {
    console.error('Movements GET error:', error)
    return NextResponse.json({ movements: [] })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const crypto = require('crypto')
    const id = crypto.randomUUID()
    const movementType = body.movementType || 'IN'
    const quantity = Number(body.quantity || 0)
    const productId = body.productId

    if (!productId || quantity <= 0) {
      return NextResponse.json({ error: 'Product and valid quantity required' }, { status: 400 })
    }

    // Verify product belongs to tenant
    const productResult = await pool.query(
      'SELECT id, name, sku FROM "Product" WHERE id = $1 AND "organizationId" = $2',
      [productId, session.organizationId]
    )
    
    if (productResult.rows.length === 0) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    const productName = productResult.rows[0].name

    // Insert StockMove - with correct columns including date
    const insertResult = await pool.query(`
      INSERT INTO "StockMove" (id, type, date, status, "productId", quantity, "fromLocationId", "toLocationId", "organizationId", "createdAt", "updatedAt")
      VALUES ($1, $2, NOW(), 'COMPLETED', $3, $4, $5, $6, $7, NOW(), NOW())
      RETURNING *
    `, [id, movementType, productId, quantity, body.fromLocationId || null, body.toLocationId || null, session.organizationId])

    // Update stock quantity
    if (movementType === 'IN' || movementType === 'RECEIPT') {
      const locationResult = await pool.query('SELECT id FROM "StockLocation" LIMIT 1').catch(() => ({ rows: [] }))
      const locationId = locationResult.rows[0]?.id || null

      const existing = await pool.query('SELECT id FROM "StockQuantity" WHERE "productId" = $1', [productId]).catch(() => ({ rows: [] }))
      if (existing.rows.length > 0) {
        await pool.query('UPDATE "StockQuantity" SET quantity = quantity + $1, "availableQty" = "availableQty" + $1, "updatedAt" = NOW() WHERE "productId" = $2', [quantity, productId])
      } else if (locationId) {
        const stockId = crypto.randomUUID()
        await pool.query('INSERT INTO "StockQuantity" (id, quantity, "reservedQty", "availableQty", "productId", "locationId", "createdAt", "updatedAt") VALUES ($1, $2, 0, $2, $3, $4, NOW(), NOW())', [stockId, quantity, productId, locationId])
      }
    } else if (movementType === 'OUT' || movementType === 'DELIVERY') {
      await pool.query('UPDATE "StockQuantity" SET quantity = GREATEST(0, quantity - $1), "availableQty" = GREATEST(0, "availableQty" - $1), "updatedAt" = NOW() WHERE "productId" = $2', [quantity, productId])
    }

    return NextResponse.json({ 
      success: true, 
      movement: { ...insertResult.rows[0], productName },
      message: 'Movement recorded successfully' 
    }, { status: 201 })
  } catch (error) {
    console.error('Movements POST error:', error)
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

    const result = await pool.query(
      'DELETE FROM "StockMove" WHERE id = $1 AND "organizationId" = $2',
      [id, session.organizationId]
    )

    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'Movement not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, message: 'Movement deleted' })
  } catch (error) {
    console.error('Movements DELETE error:', error)
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
  }
}