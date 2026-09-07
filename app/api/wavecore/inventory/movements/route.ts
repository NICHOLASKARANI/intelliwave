export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/wavecore/auth'
import { pool } from '@/lib/wavecore/db'

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const result = await pool.query(`
      SELECT sm.*, p.name as "productName"
      FROM "StockMove" sm
      LEFT JOIN "Product" p ON p.id = sm."productId"
      WHERE sm."organizationId" = $1
      ORDER BY sm."createdAt" DESC LIMIT 200
    `, [session.organizationId]).catch(() => ({ rows: [] }))

    return NextResponse.json({ movements: result.rows })
  } catch (error) {
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

    const typeMap: Record<string, string> = {
      'IN': 'RECEIPT',
      'OUT': 'DELIVERY',
      'TRANSFER': 'TRANSFER',
      'ADJUSTMENT': 'ADJUSTMENT'
    }
    const movementType = typeMap[body.movementType || 'IN'] || 'RECEIPT'
    const quantity = Number(body.quantity || 0)
    const productId = body.productId
    const fromLocation = body.fromLocation || ''
    const toLocation = body.toLocation || ''

    if (!productId || quantity <= 0) {
      return NextResponse.json({ error: 'Product and valid quantity required' }, { status: 400 })
    }

    const productResult = await pool.query(
      'SELECT name FROM "Product" WHERE id = $1 AND "organizationId" = $2',
      [productId, session.organizationId]
    )

    if (productResult.rows.length === 0) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Save locations in notes field as JSON
    const notes = JSON.stringify({ fromLocation, toLocation })

    // Insert StockMove with notes containing locations
    const insertResult = await pool.query(`
      INSERT INTO "StockMove" (id, type, date, status, notes, "productId", quantity, "organizationId", "createdAt", "updatedAt")
      VALUES ($1, $2, NOW(), 'COMPLETED', $3, $4, $5, $6, NOW(), NOW())
      RETURNING *
    `, [id, movementType, notes, productId, quantity, session.organizationId])

    // Update stock
    if (movementType === 'RECEIPT') {
      const existing = await pool.query('SELECT id FROM "StockQuantity" WHERE "productId" = $1', [productId])
      if (existing.rows.length > 0) {
        await pool.query('UPDATE "StockQuantity" SET quantity = quantity + $1, "availableQty" = "availableQty" + $1, "updatedAt" = NOW() WHERE "productId" = $2', [quantity, productId])
      } else {
        const locResult = await pool.query('SELECT id FROM "StockLocation" LIMIT 1')
        if (locResult.rows.length > 0) {
          await pool.query('INSERT INTO "StockQuantity" (id, quantity, "reservedQty", "availableQty", "productId", "locationId", "createdAt", "updatedAt") VALUES ($1, $2, 0, $2, $3, $4, NOW(), NOW())', [crypto.randomUUID(), quantity, productId, locResult.rows[0].id])
        }
      }
    }

    const movement = {
      ...insertResult.rows[0],
      productName: productResult.rows[0].name,
      fromLocation,
      toLocation
    }

    return NextResponse.json({ success: true, movement, message: 'Movement recorded' }, { status: 201 })
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

    await pool.query('DELETE FROM "StockMove" WHERE id = $1 AND "organizationId" = $2', [id, session.organizationId])
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
  }
}