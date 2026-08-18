import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { getSession } from '@/lib/wavecore/auth'

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Get store products (from Product table)
    const products = await pool.query(
      `SELECT p.*, sq.quantity as stock_level
       FROM "Product" p
       LEFT JOIN "StockQuantity" sq ON sq."productId" = p.id
       WHERE p."organizationId" = $1
       ORDER BY p."createdAt" DESC`,
      [session.organizationId]
    )

    // Get recent sales
    const sales = await pool.query(
      `SELECT ci.*, c.name as customer_name
       FROM "CustomerInvoice" ci
       LEFT JOIN "Customer" c ON c.id = ci."customerId"
       WHERE ci."organizationId" = $1
       ORDER BY ci."createdAt" DESC
       LIMIT 10`,
      [session.organizationId]
    )

    return NextResponse.json({
      products: products.rows,
      sales: sales.rows,
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch store data' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const result = await pool.query(
      `INSERT INTO "Product" (name, sku, price, "organizationId", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, NOW(), NOW())
       RETURNING *`,
      [body.name, body.sku, body.price, session.organizationId]
    )

    return NextResponse.json({ product: result.rows[0] }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 })
  }
}