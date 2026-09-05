export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/wavecore/auth'
import { pool } from '@/lib/wavecore/db'

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const result = await pool.query(`
      SELECT sm.*, p.name as "productName" FROM "StockMove" sm
      LEFT JOIN "Product" p ON p.id = sm."productId"
      WHERE sm."organizationId" = $1 ORDER BY sm."createdAt" DESC LIMIT 200
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
    const movementType = body.movementType || body.type || 'IN'
    const quantity = Number(body.quantity || 0)
    const productId = body.productId

    if (!productId || quantity <= 0) return NextResponse.json({ error: 'Product and valid quantity required' }, { status: 400 })

    const productResult = await pool.query('SELECT name FROM "Product" WHERE id = $1 AND "organizationId" = $2', [productId, session.organizationId]).catch(() => ({ rows: [] }))
    const productName = productResult.rows[0]?.name || 'N/A'

    await pool.query(`
      INSERT INTO "StockMove" (id, type, status, "productId", "productName", quantity, "fromLocation", "toLocation", "organizationId", "createdAt", "updatedAt")
      VALUES ($1, $2, 'COMPLETED', $3, $4, $5, $6, $7, $8, NOW(), NOW())
    `, [id, movementType, productId, productName, quantity, body.fromLocation || '', body.toLocation || '', session.organizationId]).catch(() => {})

    if (movementType === 'IN' || movementType === 'RECEIPT') {
      const existing = await pool.query('SELECT id FROM "StockQuantity" WHERE "productId" = $1 AND "organizationId" = $2', [productId, session.organizationId]).catch(() => ({ rows: [] }))
      if (existing.rows.length > 0) {
        await pool.query('UPDATE "StockQuantity" SET quantity = quantity + $1, "updatedAt" = NOW() WHERE "productId" = $2 AND "organizationId" = $3', [quantity, productId, session.organizationId]).catch(() => {})
      } else {
        const stockId = crypto.randomUUID()
        await pool.query('INSERT INTO "StockQuantity" (id, quantity, "availableQty", "productId", "organizationId", "createdAt", "updatedAt") VALUES ($1, $2, $2, $3, $4, NOW(), NOW())', [stockId, quantity, productId, session.organizationId]).catch(() => {})
      }
    } else if (movementType === 'OUT' || movementType === 'DELIVERY') {
      await pool.query('UPDATE "StockQuantity" SET quantity = GREATEST(0, quantity - $1), "updatedAt" = NOW() WHERE "productId" = $2 AND "organizationId" = $3', [quantity, productId, session.organizationId]).catch(() => {})
    }

    return NextResponse.json({ success: true, movementId: id }, { status: 201 })
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
    console.error('Movements DELETE error:', error)
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
  }
}