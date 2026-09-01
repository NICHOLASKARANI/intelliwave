export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/wavecore/auth'
import { pool } from '@/lib/wavecore/db'

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const result = await pool.query(
      `SELECT p.*, COALESCE(sq."availableQty", sq.quantity, 0) as stock_level
       FROM "Product" p
       LEFT JOIN "StockQuantity" sq ON sq."productId" = p.id
       WHERE p."organizationId" = $1
       ORDER BY p.name ASC`,
      [session.organizationId]
    )

    return NextResponse.json({ products: result.rows })
  } catch (error) {
    return NextResponse.json({ products: [] })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { productId, quantity } = body

    if (!productId || !quantity || quantity <= 0) {
      return NextResponse.json({ error: 'Product and quantity required' }, { status: 400 })
    }

    const crypto = require('crypto')

    // Check if stock exists for this product
    const stockResult = await pool.query(
      `SELECT * FROM "StockQuantity" WHERE "productId" = $1`,
      [productId]
    )

    if (stockResult.rows.length > 0) {
      // Update existing stock
      const updated = await pool.query(
        `UPDATE "StockQuantity" SET quantity = quantity + $1, "availableQty" = "availableQty" + $1, "updatedAt" = NOW()
         WHERE "productId" = $2 RETURNING *`,
        [quantity, productId]
      )
      return NextResponse.json({ stock: updated.rows[0], mode: 'UPDATED' }, { status: 200 })
    } else {
      // Get location
      const locationResult = await pool.query(`SELECT id FROM "StockLocation" LIMIT 1`)
      let locationId = null
      if (locationResult.rows.length > 0) {
        locationId = locationResult.rows[0].id
      }

      // Create new stock
      const created = await pool.query(
        `INSERT INTO "StockQuantity" (id, quantity, "reservedQty", "availableQty", "productId", "locationId", "createdAt", "updatedAt")
         VALUES ($1, $2, 0, $2, $3, $4, NOW(), NOW()) RETURNING *`,
        [crypto.randomUUID(), quantity, productId, locationId]
      )
      return NextResponse.json({ stock: created.rows[0], mode: 'CREATED' }, { status: 201 })
    }
  } catch (error) {
    console.error('Stock in error:', error)
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}