export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

const movementSchema = z.object({
  type: z.enum(['RECEIPT', 'DELIVERY', 'TRANSFER', 'ADJUSTMENT', 'RETURN', 'SCRAP']),
  productId: z.string(),
  quantity: z.number(),
  fromLocationId: z.string().optional(),
  toLocationId: z.string().optional(),
  reference: z.string().optional(),
  notes: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant()

    const result = await pool.query(
      `SELECT sm.*, p.name as product_name, p.sku,
              fl.name as from_location, tl.name as to_location
       FROM "StockMove" sm
       JOIN "Product" p ON p.id = sm."productId"
       LEFT JOIN "StockLocation" fl ON fl.id = sm."fromLocationId"
       LEFT JOIN "StockLocation" tl ON tl.id = sm."toLocationId"
       WHERE sm."organizationId" = $1
       ORDER BY sm."createdAt" DESC
       LIMIT 100`,
      [session.organizationId]
    )

    return NextResponse.json({ movements: result.rows })
  } catch (error) {
    console.error('Movements GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const client = await pool.connect()
  try {
    const session = await requireTenant()

    const body = await request.json()
    const validated = movementSchema.parse(body)

    // Verify product belongs to tenant
    const product = await client.query(
      'SELECT id FROM "Product" WHERE id = $1 AND "organizationId" = $2',
      [validated.productId, session.organizationId]
    )
    if (product.rows.length === 0) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    await client.query('BEGIN')

    const movement = await client.query(
      `INSERT INTO "StockMove" (id, type, reference, status, notes, "productId", quantity, "fromLocationId", "toLocationId", "organizationId", "createdAt", "updatedAt")
       VALUES (gen_random_uuid()::text, $1, $2, 'COMPLETED', $3, $4, $5, $6, $7, $8, NOW(), NOW())
       RETURNING id`,
      [validated.type, validated.reference || null, validated.notes || null, validated.productId, validated.quantity, validated.fromLocationId || null, validated.toLocationId || null, session.organizationId]
    )

    // Update stock quantity
    if (validated.toLocationId) {
      await client.query(
        `INSERT INTO "StockQuantity" (id, quantity, "availableQty", "productId", "locationId", "createdAt", "updatedAt")
         VALUES (gen_random_uuid()::text, $1, $1, $2, $3, NOW(), NOW())
         ON CONFLICT ("productId", "locationId")
         DO UPDATE SET quantity = "StockQuantity".quantity + $1, "availableQty" = "StockQuantity"."availableQty" + $1, "updatedAt" = NOW()`,
        [validated.quantity, validated.productId, validated.toLocationId]
      )
    }

    if (validated.fromLocationId) {
      await client.query(
        `UPDATE "StockQuantity"
         SET quantity = quantity - $1, "availableQty" = "availableQty" - $1, "updatedAt" = NOW()
         WHERE "productId" = $2 AND "locationId" = $3`,
        [validated.quantity, validated.productId, validated.fromLocationId]
      )
    }

    await client.query('COMMIT')

    return NextResponse.json({ success: true, movementId: movement.rows[0].id }, { status: 201 })
  } catch (error) {
    await client.query('ROLLBACK')
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed' }, { status: 422 })
    }
    console.error('Movements POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  } finally {
    client.release()
  }
}