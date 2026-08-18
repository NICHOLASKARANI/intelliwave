export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

const warehouseSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)

    const result = await pool.query(
      `SELECT w.*,
              (SELECT COUNT(*) FROM "StockLocation" sl WHERE sl."warehouseId" = w.id) as location_count,
              (SELECT COALESCE(SUM(sq.quantity), 0) FROM "StockQuantity" sq JOIN "StockLocation" sl ON sl.id = sq."locationId" WHERE sl."warehouseId" = w.id) as total_stock
       FROM "Warehouse" w
       WHERE w."organizationId" = $1 AND w."isActive" = true
       ORDER BY w."createdAt" DESC`,
      [session.organizationId]
    )

    return NextResponse.json({ warehouses: result.rows })
  } catch (error) {
    console.error('Warehouses GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireTenant(request)

    const body = await request.json()
    const validated = warehouseSchema.parse(body)

    const result = await pool.query(
      `INSERT INTO "Warehouse" (id, name, code, address, city, country, "isActive", "organizationId", "createdAt", "updatedAt")
       VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, true, $6, NOW(), NOW())
       RETURNING id, name, code`,
      [validated.name, validated.code, validated.address || null, validated.city || null, validated.country || null, session.organizationId]
    )

    return NextResponse.json({ success: true, warehouse: result.rows[0] }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed' }, { status: 422 })
    }
    console.error('Warehouses POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}