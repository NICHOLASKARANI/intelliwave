export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/wavecore/auth'
import { pool } from '@/lib/wavecore/db'

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const result = await pool.query(`
      SELECT w.*,
        (SELECT COUNT(*) FROM "StockLocation" sl WHERE sl."warehouseId" = w.id) as "locationCount",
        (SELECT COALESCE(SUM(sq.quantity), 0) FROM "StockQuantity" sq JOIN "StockLocation" sl ON sq."locationId" = sl.id WHERE sl."warehouseId" = w.id) as "totalStock",
        (SELECT COALESCE(SUM(p."sellingPrice" * COALESCE(sq.quantity, 0)), 0) FROM "StockQuantity" sq JOIN "StockLocation" sl ON sq."locationId" = sl.id JOIN "Product" p ON sq."productId" = p.id WHERE sl."warehouseId" = w.id) as "stockValue"
      FROM "Warehouse" w WHERE w."organizationId" = $1 ORDER BY w.name ASC
    `, [session.organizationId]).catch(() => ({ rows: [] }))

    return NextResponse.json({ warehouses: result.rows })
  } catch (error) {
    console.error('Warehouses GET error:', error)
    return NextResponse.json({ warehouses: [] })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const crypto = require('crypto')
    const id = crypto.randomUUID()

    // Insert Warehouse
    const result = await pool.query(`
      INSERT INTO "Warehouse" (id, name, code, address, city, country, "isActive", "organizationId", "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW()) RETURNING *
    `, [id, body.name, body.code || 'WH-' + Date.now().toString().slice(-4), body.address || '', body.city || '', body.country || '', body.isActive !== false, session.organizationId])

    // Create StockLocation for this warehouse
    const locationId = crypto.randomUUID()
    const locationName = body.locationName || 'Default Location'
    const locationCode = body.locationCode || 'LOC-' + Date.now().toString().slice(-4)
    
    await pool.query(`
      INSERT INTO "StockLocation" (id, name, code, "warehouseId", "isActive", "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, true, NOW(), NOW())
    `, [locationId, locationName, locationCode, id]).catch((err) => {
      console.error('StockLocation insert error:', err.message)
    })

    // If initial stock is provided, create StockQuantity
    const initialStock = Number(body.initialStock || 0)
    if (initialStock > 0 && body.productId) {
      const stockId = crypto.randomUUID()
      await pool.query(`
        INSERT INTO "StockQuantity" (id, quantity, "reservedQty", "availableQty", "productId", "locationId", "createdAt", "updatedAt")
        VALUES ($1, $2, 0, $2, $3, $4, NOW(), NOW())
      `, [stockId, initialStock, body.productId, locationId]).catch((err) => {
        console.error('StockQuantity insert error:', err.message)
      })
    }

    // Return warehouse with location count, total stock, stock value
    const warehouseWithStats = {
      ...result.rows[0],
      locationCount: 1,
      totalStock: initialStock,
      stockValue: initialStock * Number(body.sellingPrice || 0)
    }

    return NextResponse.json({ warehouse: warehouseWithStats }, { status: 201 })
  } catch (error) {
    console.error('Warehouses POST error:', error)
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

    // Delete StockQuantity first
    await pool.query('DELETE FROM "StockQuantity" WHERE "locationId" IN (SELECT id FROM "StockLocation" WHERE "warehouseId" = $1)', [id]).catch(() => {})
    // Delete StockLocation
    await pool.query('DELETE FROM "StockLocation" WHERE "warehouseId" = $1', [id]).catch(() => {})
    // Delete Warehouse
    await pool.query('DELETE FROM "Warehouse" WHERE id = $1 AND "organizationId" = $2', [id, session.organizationId])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Warehouses DELETE error:', error)
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
  }
}