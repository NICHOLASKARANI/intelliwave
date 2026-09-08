export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/wavecore/auth'
import { pool } from '@/lib/wavecore/db'

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const barcode = searchParams.get('barcode')
    const sku = searchParams.get('sku')
    const productId = searchParams.get('productId')

    if (barcode) {
      // Lookup by barcode
      const result = await pool.query(`
        SELECT p.*, COALESCE(sq.quantity, 0) as "currentStock"
        FROM "Product" p
        LEFT JOIN "StockQuantity" sq ON sq."productId" = p.id
        WHERE p.barcode = $1 AND p."organizationId" = $2
      `, [barcode, session.organizationId])
      
      if (result.rows.length === 0) {
        return NextResponse.json({ error: 'Product not found with this barcode' }, { status: 404 })
      }
      return NextResponse.json({ product: result.rows[0] })
    }

    if (sku) {
      const result = await pool.query(`
        SELECT p.*, COALESCE(sq.quantity, 0) as "currentStock"
        FROM "Product" p
        LEFT JOIN "StockQuantity" sq ON sq."productId" = p.id
        WHERE p.sku = $1 AND p."organizationId" = $2
      `, [sku, session.organizationId])
      
      if (result.rows.length === 0) {
        return NextResponse.json({ error: 'Product not found with this SKU' }, { status: 404 })
      }
      return NextResponse.json({ product: result.rows[0] })
    }

    // List all products with barcode info
    const products = await pool.query(`
      SELECT p.id, p.name, p.sku, p.barcode, p."sellingPrice",
        COALESCE(sq.quantity, 0) as "currentStock"
      FROM "Product" p
      LEFT JOIN "StockQuantity" sq ON sq."productId" = p.id
      WHERE p."organizationId" = $1
      ORDER BY p.name ASC
    `, [session.organizationId])

    return NextResponse.json({ products: products.rows })
  } catch (error) {
    console.error('Barcode error:', error)
    return NextResponse.json({ products: [], error: 'Failed' })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const crypto = require('crypto')
    const barcode = body.barcode || 'BC-' + crypto.randomUUID().substring(0, 10).toUpperCase()

    // Check if barcode already exists
    const existing = await pool.query(
      'SELECT id FROM "Product" WHERE barcode = $1 AND "organizationId" = $2',
      [barcode, session.organizationId]
    )

    if (existing.rows.length > 0) {
      return NextResponse.json({ error: 'Barcode already exists' }, { status: 400 })
    }

    // Update product with barcode
    const result = await pool.query(`
      UPDATE "Product" SET barcode = $1, "updatedAt" = NOW()
      WHERE id = $2 AND "organizationId" = $3 RETURNING *
    `, [barcode, body.productId, session.organizationId])

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    return NextResponse.json({ 
      success: true, 
      product: result.rows[0],
      barcode: barcode,
      message: 'Barcode generated' 
    }, { status: 201 })
  } catch (error) {
    console.error('Barcode POST error:', error)
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}