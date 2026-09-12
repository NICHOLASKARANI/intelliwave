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
        (SELECT sl.name FROM "StockLocation" sl WHERE sl."warehouseId" = w.id LIMIT 1) as "locationName",
        (SELECT p.name FROM "Product" p JOIN "StockQuantity" sq ON sq."productId" = p.id JOIN "StockLocation" sl ON sq."locationId" = sl.id WHERE sl."warehouseId" = w.id LIMIT 1) as "productName",
        (SELECT COALESCE(SUM(sq.quantity), 0) FROM "StockQuantity" sq JOIN "StockLocation" sl ON sq."locationId" = sl.id WHERE sl."warehouseId" = w.id) as "totalStock",
        (SELECT COALESCE(SUM(p."sellingPrice" * COALESCE(sq.quantity, 0)), 0) FROM "StockQuantity" sq JOIN "StockLocation" sl ON sq."locationId" = sl.id JOIN "Product" p ON sq."productId" = p.id WHERE sl."warehouseId" = w.id) as "stockValue"
      FROM "Warehouse" w WHERE w."organizationId" = $1 ORDER BY w.name ASC
    `, [session.organizationId]).catch(() => ({ rows: [] }))

    return NextResponse.json({ warehouses: result.rows })
  } catch (error) {
    return NextResponse.json({ warehouses: [] })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    console.log('WAREHOUSE POST BODY:', JSON.stringify(body))

    const crypto = require('crypto')
    const id = crypto.randomUUID()

    // USE body.code IF PROVIDED, otherwise auto-generate
    const uniqueCode = (body.code && body.code.trim() !== '') 
      ? body.code.trim() 
      : 'WH-' + Date.now().toString(36).toUpperCase() + '-' + crypto.randomUUID().substring(0, 4).toUpperCase()

    // Get product name if productId provided
    let productName = ''
    if (body.productId) {
      const productResult = await pool.query('SELECT name FROM "Product" WHERE id = $1', [body.productId]).catch(() => ({ rows: [] }))
      productName = productResult.rows[0]?.name || ''
    }

    // Insert Warehouse with the USER'S code
    const result = await pool.query(`
      INSERT INTO "Warehouse" (id, name, code, address, city, country, "isActive", "organizationId", "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW()) RETURNING *
    `, [id, body.name, uniqueCode, body.address || '', body.city || '', body.country || '', body.isActive !== false, session.organizationId])

    // Create StockLocation
    const numLocations = Math.max(1, Number(body.locationsCount || 1))
    const locationName = body.locationName || 'Default Location'
    let firstLocationId = null

    for (let i = 0; i < numLocations; i++) {
      const locationId = crypto.randomUUID()
      const locName = numLocations > 1 ? locationName + ' ' + (i + 1) : locationName
      const locCode = 'LOC-' + crypto.randomUUID().substring(0, 8).toUpperCase()
      
      try {
        await pool.query(`
          INSERT INTO "StockLocation" (id, name, code, "warehouseId", "isActive", "createdAt", "updatedAt")
          VALUES ($1, $2, $3, $4, true, NOW(), NOW())
        `, [locationId, locName, locCode, id])
        console.log('StockLocation CREATED:', locationId, locName)
        if (i === 0) firstLocationId = locationId
      } catch (err: any) {
        console.error('StockLocation insert FAILED:', err.message)
      }
    }

    // Create StockQuantity if initialStock and productId
    const initialStock = Number(body.initialStock || 0)
    let totalStock = 0
    let stockValue = 0

    if (initialStock > 0 && body.productId && firstLocationId) {
      const stockId = crypto.randomUUID()
      try {
        await pool.query(`
          INSERT INTO "StockQuantity" (id, quantity, "reservedQty", "availableQty", "productId", "locationId", "createdAt", "updatedAt")
          VALUES ($1, $2, 0, $2, $3, $4, NOW(), NOW())
        `, [stockId, initialStock, body.productId, firstLocationId])
        console.log('StockQuantity CREATED:', stockId, 'qty:', initialStock)
        totalStock = initialStock

        const productResult = await pool.query('SELECT "sellingPrice" FROM "Product" WHERE id = $1', [body.productId]).catch(() => ({ rows: [] }))
        const sellingPrice = Number(productResult.rows[0]?.sellingPrice || 0)
        stockValue = initialStock * sellingPrice
      } catch (err: any) {
        console.error('StockQuantity insert FAILED:', err.message)
      }
    } else {
      console.log('SKIPPED StockQuantity - initialStock:', initialStock, 'productId:', body.productId, 'firstLocationId:', firstLocationId)
    }

    return NextResponse.json({ 
      warehouse: { ...result.rows[0], locationCount: numLocations, locationName, productName, totalStock, stockValue },
      message: 'Warehouse created' 
    }, { status: 201 })
  } catch (error) {
    console.error('Warehouse POST error:', error)
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

    await pool.query('DELETE FROM "StockQuantity" WHERE "locationId" IN (SELECT id FROM "StockLocation" WHERE "warehouseId" = $1)', [id]).catch(() => {})
    await pool.query('DELETE FROM "StockLocation" WHERE "warehouseId" = $1', [id]).catch(() => {})
    await pool.query('DELETE FROM "Warehouse" WHERE id = $1 AND "organizationId" = $2', [id, session.organizationId])

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
  }
}