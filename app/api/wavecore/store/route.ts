export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session || !session!.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const products = await pool.query(
      `SELECT p.*, sq.quantity as stock_level
       FROM "Product" p
       LEFT JOIN "StockQuantity" sq ON sq."productId" = p.id
       WHERE p."organizationId" = $1
       ORDER BY p."createdAt" DESC`,
      [session!.organizationId]
    )

    const sales = await pool.query(
      `SELECT ci.*, c.name as customer_name
       FROM "CustomerInvoice" ci
       LEFT JOIN "Customer" c ON c.id = ci."customerId"
       WHERE ci."organizationId" = $1
       ORDER BY ci."createdAt" DESC LIMIT 50`,
      [session!.organizationId]
    )

    return NextResponse.json({
      products: products.rows,
      sales: sales.rows,
      totalProducts: products.rows.length,
      totalSales: sales.rows.length,
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed: ' + (error as Error).message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const crypto = require('crypto')
    const productId = crypto.randomUUID()

    const result = await pool.query(
      `INSERT INTO "Product" (id, name, sku, description, category, "sellingPrice", "costPrice", "minStock", "maxStock", "isActive", "organizationId", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true, $10, NOW(), NOW())
       RETURNING *`,
      [productId, body.name, body.sku, body.description || '', body.category || 'General', body.sellingPrice || 0, body.costPrice || 0, body.minStock || 0, body.maxStock || 0, session!.organizationId]
    )

    return NextResponse.json({ product: result.rows[0] }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Create failed: ' + (error as Error).message }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const result = await pool.query(
      `UPDATE "Product" 
       SET name = $1, sku = $2, description = $3, category = $4, "sellingPrice" = $5, "costPrice" = $6, "minStock" = $7, "maxStock" = $8, "updatedAt" = NOW()
       WHERE id = $9 AND "organizationId" = $10
       RETURNING *`,
      [body.name, body.sku, body.description, body.category, body.sellingPrice, body.costPrice, body.minStock, body.maxStock, body.id, session!.organizationId]
    )

    if (result.rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ product: result.rows[0] })
  } catch (error) {
    return NextResponse.json({ error: 'Update failed: ' + (error as Error).message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    await pool.query(`DELETE FROM "Product" WHERE id = $1 AND "organizationId" = $2`, [id, session!.organizationId])

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Delete failed: ' + (error as Error).message }, { status: 500 })
  }
}