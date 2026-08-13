export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

const productSchema = z.object({
  name: z.string().min(1),
  sku: z.string().min(1),
  barcode: z.string().optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  unit: z.string().default('Unit'),
  costPrice: z.number().min(0).default(0),
  sellingPrice: z.number().min(0).default(0),
  minStock: z.number().min(0).default(0),
  maxStock: z.number().min(0).default(0),
  warehouseId: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant()

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const lowStock = searchParams.get('lowStock') === 'true'
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '20')
    const offset = (page - 1) * pageSize

    let query = `
      SELECT p.*,
             (SELECT COALESCE(SUM(sq.quantity), 0) FROM "StockQuantity" sq WHERE sq."productId" = p.id) as total_stock,
             (SELECT COALESCE(SUM(sq."availableQty"), 0) FROM "StockQuantity" sq WHERE sq."productId" = p.id) as available_stock
      FROM "Product" p
      WHERE p."organizationId" = $1
    `
    const params: any[] = [session.organizationId]

    if (search) {
      params.push(`%${search}%`)
      query += ` AND (p.name ILIKE $${params.length} OR p.sku ILIKE $${params.length} OR p.category ILIKE $${params.length})`
    }

    if (lowStock) {
      query += ` AND (SELECT COALESCE(SUM(sq.quantity), 0) FROM "StockQuantity" sq WHERE sq."productId" = p.id) <= p."minStock"`
    }

    query += ` ORDER BY p."createdAt" DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`
    params.push(pageSize, offset)

    const result = await pool.query(query, params)

    const countResult = await pool.query(
      'SELECT COUNT(*) FROM "Product" WHERE "organizationId" = $1',
      [session.organizationId]
    )

    return NextResponse.json({
      products: result.rows,
      pagination: {
        page, pageSize,
        total: parseInt(countResult.rows[0].count),
        totalPages: Math.ceil(parseInt(countResult.rows[0].count) / pageSize),
      },
    })
  } catch (error) {
    console.error('Products GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireTenant()

    const body = await request.json()
    const validated = productSchema.parse(body)

    // Check SKU uniqueness within organization
    const skuCheck = await pool.query(
      'SELECT id FROM "Product" WHERE sku = $1 AND "organizationId" = $2',
      [validated.sku, session.organizationId]
    )
    if (skuCheck.rows.length > 0) {
      return NextResponse.json({ error: 'SKU already exists' }, { status: 409 })
    }

    const result = await pool.query(
      `INSERT INTO "Product" (id, name, sku, barcode, description, category, unit, "costPrice", "sellingPrice", "minStock", "maxStock", "organizationId", "createdAt", "updatedAt")
       VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
       RETURNING id, name, sku`,
      [validated.name, validated.sku, validated.barcode || null, validated.description || null, validated.category || null, validated.unit, validated.costPrice, validated.sellingPrice, validated.minStock, validated.maxStock, session.organizationId]
    )

    return NextResponse.json({ success: true, product: result.rows[0] }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed' }, { status: 422 })
    }
    console.error('Products POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}