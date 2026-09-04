export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const result = await pool.query(`
      SELECT sm.*, p.name as "productName", p.sku
      FROM "StockMove" sm
      LEFT JOIN "Product" p ON p.id = sm."productId"
      WHERE sm."organizationId" = $1
      ORDER BY sm."createdAt" DESC
      LIMIT 100
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

    // Accept both movementType and type fields
    const movementType = body.movementType || body.type || 'IN'
    const quantity = Number(body.quantity || 0)
    const productId = body.productId
    const toLocation = body.toLocation || body.toLocationId || ''

    if (!productId || quantity <= 0) {
      return NextResponse.json({ error: 'Product and valid quantity required' }, { status: 400 })
    }

    // Insert movement
    await pool.query(`
      INSERT INTO "StockMove" (id, type, status, "productId", quantity, "toLocation", "organizationId", "createdAt", "updatedAt")
      VALUES ($1, $2, 'COMPLETED', $3, $4, $5, $6, NOW(), NOW())
    `, [id, movementType, productId, quantity, toLocation, session.organizationId]).catch(() => {})

    // Update stock quantity
    if (movementType === 'IN' || movementType === 'RECEIPT') {
      await pool.query(`
        UPDATE "StockQuantity" SET quantity = quantity + $1, "updatedAt" = NOW()
        WHERE "productId" = $2 AND "organizationId" = $3
      `, [quantity, productId, session.organizationId]).catch(async () => {
        // If no existing StockQuantity, create one
        const stockId = crypto.randomUUID()
        await pool.query(`
          INSERT INTO "StockQuantity" (id, quantity, "availableQty", "productId", "organizationId", "createdAt", "updatedAt")
          VALUES ($1, $2, $2, $3, $4, NOW(), NOW())
        `, [stockId, quantity, productId, session.organizationId]).catch(() => {})
      })
    } else if (movementType === 'OUT' || movementType === 'DELIVERY') {
      await pool.query(`
        UPDATE "StockQuantity" SET quantity = quantity - $1, "updatedAt" = NOW()
        WHERE "productId" = $2 AND "organizationId" = $3
      `, [quantity, productId, session.organizationId]).catch(() => {})
    }

    return NextResponse.json({ success: true, movementId: id }, { status: 201 })
  } catch (error) {
    console.error('Movements POST error:', error)
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}