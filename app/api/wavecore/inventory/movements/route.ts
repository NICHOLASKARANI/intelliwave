export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/wavecore/auth'
import { pool } from '@/lib/wavecore/db'

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const result = await pool.query(`
      SELECT sm.*, p.name as "productName", p.sku,
             fl.name as "fromLocation", tl.name as "toLocation"
      FROM "StockMove" sm
      LEFT JOIN "Product" p ON p.id = sm."productId"
      LEFT JOIN "StockLocation" fl ON fl.id = sm."fromLocationId"
      LEFT JOIN "StockLocation" tl ON tl.id = sm."toLocationId"
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
    
    // Map movement type to valid enum values
    const typeMap: Record<string, string> = {
      'IN': 'RECEIPT',
      'OUT': 'DELIVERY',
      'TRANSFER': 'TRANSFER',
      'ADJUSTMENT': 'ADJUSTMENT',
      'RECEIPT': 'RECEIPT',
      'DELIVERY': 'DELIVERY',
      'RETURN': 'RETURN',
      'SCRAP': 'SCRAP'
    }
    const movementType = typeMap[body.movementType || body.type || 'RECEIPT'] || 'RECEIPT'
    const quantity = Number(body.quantity || 0)
    const productId = body.productId

    if (!productId || quantity <= 0) {
      return NextResponse.json({ error: 'Product and valid quantity required' }, { status: 400 })
    }

    // Verify product belongs to tenant
    const productResult = await pool.query(
      'SELECT name FROM "Product" WHERE id = $1 AND "organizationId" = $2',
      [productId, session.organizationId]
    )
    
    if (productResult.rows.length === 0) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Get location IDs from location names or use default
    let fromLocationId = body.fromLocationId || null
    let toLocationId = body.toLocationId || null
    
    if (body.fromLocation && !fromLocationId) {
      const fromLoc = await pool.query('SELECT id FROM "StockLocation" WHERE name = $1 LIMIT 1', [body.fromLocation]).catch(() => ({ rows: [] }))
      fromLocationId = fromLoc.rows[0]?.id || null
    }
    if (body.toLocation && !toLocationId) {
      const toLoc = await pool.query('SELECT id FROM "StockLocation" WHERE name = $1 LIMIT 1', [body.toLocation]).catch(() => ({ rows: [] }))
      toLocationId = toLoc.rows[0]?.id || null
    }

    // Insert StockMove with valid enum and date
    const insertResult = await pool.query(`
      INSERT INTO "StockMove" (id, type, date, status, "productId", quantity, "fromLocationId", "toLocationId", "organizationId", "createdAt", "updatedAt")
      VALUES ($1, $2, NOW(), 'COMPLETED', $3, $4, $5, $6, $7, NOW(), NOW())
      RETURNING *
    `, [id, movementType, productId, quantity, fromLocationId, toLocationId, session.organizationId])

    // Update stock quantity
    if (movementType === 'RECEIPT' || body.movementType === 'IN') {
      const locationResult = await pool.query('SELECT id FROM "StockLocation" LIMIT 1').catch(() => ({ rows: [] }))
      const locationId = toLocationId || locationResult.rows[0]?.id || null

      const existing = await pool.query('SELECT id FROM "StockQuantity" WHERE "productId" = $1', [productId]).catch(() => ({ rows: [] }))
      if (existing.rows.length > 0) {
        await pool.query('UPDATE "StockQuantity" SET quantity = quantity + $1, "availableQty" = "availableQty" + $1, "updatedAt" = NOW() WHERE "productId" = $2', [quantity, productId])
      } else if (locationId) {
        const stockId = crypto.randomUUID()
        await pool.query('INSERT INTO "StockQuantity" (id, quantity, "reservedQty", "availableQty", "productId", "locationId", "createdAt", "updatedAt") VALUES ($1, $2, 0, $2, $3, $4, NOW(), NOW())', [stockId, quantity, productId, locationId])
      }
    } else if (movementType === 'DELIVERY' || body.movementType === 'OUT') {
      await pool.query('UPDATE "StockQuantity" SET quantity = GREATEST(0, quantity - $1), "availableQty" = GREATEST(0, "availableQty" - $1), "updatedAt" = NOW() WHERE "productId" = $2', [quantity, productId])
    }

    return NextResponse.json({ 
      success: true, 
      movement: { ...insertResult.rows[0], productName: productResult.rows[0].name },
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

    if (result.rowCount === 0) return NextResponse.json({ error: 'Movement not found' }, { status: 404 })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Movements DELETE error:', error)
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
  }
}