export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/wavecore/auth'
import { pool } from '@/lib/wavecore/db'

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const products = await pool.query(
      `SELECT p.*, COALESCE(sq."availableQty", sq.quantity, 0) as stock_level
       FROM "Product" p
       LEFT JOIN "StockQuantity" sq ON sq."productId" = p.id
       WHERE p."organizationId" = $1
       ORDER BY p."createdAt" DESC`,
      [session.organizationId]
    )

    const totalValue = products.rows.reduce((sum, p) => sum + Number(p.sellingPrice || 0) * Number(p.stock_level || 0), 0)

    return NextResponse.json({
      products: products.rows,
      totalProducts: products.rows.length,
      totalInventoryValue: totalValue
    })
  } catch (error) {
    console.error('Store GET error:', error)
    return NextResponse.json({ products: [], totalProducts: 0, totalInventoryValue: 0 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const crypto = require('crypto')
    const productId = crypto.randomUUID()

    // Insert product with ALL fields
    const result = await pool.query(
      `INSERT INTO "Product" (id, name, sku, barcode, description, category, unit, "costPrice", "sellingPrice", "minStock", "maxStock", "isActive", "organizationId", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, true, $12, NOW(), NOW()) RETURNING *`,
      [
        productId,
        body.name,
        body.sku || null,
        body.barcode || null,
        body.description || null,
        body.category || 'General',
        body.unit || null,
        Number(body.costPrice) || 0,
        Number(body.sellingPrice) || 0,
        Number(body.minStock) || 0,
        Number(body.maxStock) || 100,
        session.organizationId
      ]
    )

    // Auto-create stock
    const initialStock = Number(body.initialStock) || 0
    if (initialStock > 0) {
      // Get or create StockLocation
      const locationResult = await pool.query(`SELECT id FROM "StockLocation" LIMIT 1`)
      
      let locationId = null
      if (locationResult.rows.length > 0) {
        locationId = locationResult.rows[0].id
      } else {
        const warehouseResult = await pool.query(`SELECT id FROM "Warehouse" LIMIT 1`)
        if (warehouseResult.rows.length > 0) {
          const newLocation = await pool.query(
            `INSERT INTO "StockLocation" (id, name, code, "warehouseId", "isActive", "createdAt", "updatedAt")
             VALUES ($1, 'Default Location', 'SL-DEFAULT', $2, true, NOW(), NOW()) RETURNING id`,
            [crypto.randomUUID(), warehouseResult.rows[0].id]
          )
          locationId = newLocation.rows[0].id
        }
      }

      if (locationId) {
        await pool.query(
          `INSERT INTO "StockQuantity" (id, quantity, "reservedQty", "availableQty", "productId", "locationId", "createdAt", "updatedAt")
           VALUES ($1, $2, 0, $2, $3, $4, NOW(), NOW())`,
          [crypto.randomUUID(), initialStock, productId, locationId]
        )
      }
    }

    return NextResponse.json({ product: result.rows[0], initialStock }, { status: 201 })
  } catch (error) {
    console.error('Product create error:', error)
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const result = await pool.query(
      `UPDATE "Product" SET name = $1, "sellingPrice" = $2, category = $3, "updatedAt" = NOW() WHERE id = $4 AND "organizationId" = $5 RETURNING *`,
      [body.name, body.sellingPrice || body.price, body.category, body.id, session.organizationId]
    )
    return NextResponse.json({ product: result.rows[0] })
  } catch (error) {
    return NextResponse.json({ error: 'Update failed' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    await pool.query(`DELETE FROM "StockQuantity" WHERE "productId" = $1`, [id]).catch(() => {})
    await pool.query(`DELETE FROM "Product" WHERE id = $1 AND "organizationId" = $2`, [id, session.organizationId])
    
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Delete failed: ' + (error as Error).message }, { status: 500 })
  }
}