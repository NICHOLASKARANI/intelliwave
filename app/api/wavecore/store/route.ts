export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/wavecore/auth'
import { pool } from '@/lib/wavecore/db'

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const products = await pool.query(
      `SELECT p.*, 
        COALESCE(sq.quantity, 0) as stock_level,
        p."sellingPrice" as price
       FROM "Product" p
       LEFT JOIN "StockQuantity" sq ON sq."productId" = p.id
       WHERE p."organizationId" = $1
       ORDER BY p."createdAt" DESC`,
      [session.organizationId]
    )

    return NextResponse.json({
      products: products.rows,
      totalProducts: products.rows.length,
      totalInventoryValue: products.rows.reduce((sum, p) => sum + Number(p.sellingPrice || 0) * Number(p.stock_level || 0), 0)
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
    const id = crypto.randomUUID()

    const result = await pool.query(
      `INSERT INTO "Product" (id, name, sku, description, category, "costPrice", "sellingPrice", "minStock", "maxStock", "isActive", "organizationId", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true, $10, NOW(), NOW()) RETURNING *`,
      [
        id,
        body.name,
        body.sku || null,
        body.description || null,
        body.category || 'General',
        body.costPrice || 0,
        body.sellingPrice || body.price || 0,
        body.minStock || 0,
        body.maxStock || 100
      ]
    )

    return NextResponse.json({ product: result.rows[0] }, { status: 201 })
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

    // Delete related stock first
    await pool.query(`DELETE FROM "StockQuantity" WHERE "productId" = $1`, [id]).catch(() => {})

    await pool.query(`DELETE FROM "Product" WHERE id = $1 AND "organizationId" = $2`, [id, session.organizationId])
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Delete failed: ' + (error as Error).message }, { status: 500 })
  }
}