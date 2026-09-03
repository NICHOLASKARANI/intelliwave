export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/wavecore/auth'
import { pool } from '@/lib/wavecore/db'

async function ensureAislesTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS "WarehouseAisle" (
      id TEXT PRIMARY KEY,
      "zoneId" TEXT NOT NULL,
      "warehouseId" TEXT NOT NULL,
      name TEXT NOT NULL,
      code TEXT,
      "aisleType" TEXT DEFAULT 'PICKING',
      "isActive" BOOLEAN DEFAULT true,
      "organizationId" TEXT NOT NULL,
      "createdAt" TIMESTAMP DEFAULT NOW(),
      "updatedAt" TIMESTAMP DEFAULT NOW()
    )
  `).catch(() => {})
  await pool.query(`CREATE INDEX IF NOT EXISTS "idx_aisle_zone" ON "WarehouseAisle" ("zoneId")`).catch(() => {})
}

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await ensureAislesTable()

    const result = await pool.query(`
      SELECT wa.*, 
        (SELECT COUNT(*) FROM "Rack" r WHERE r."aisleId" = wa.id) as "rackCount"
      FROM "WarehouseAisle" wa
      WHERE wa."organizationId" = $1
      ORDER BY wa.name ASC
    `, [session.organizationId]).catch(() => ({ rows: [] }))

    return NextResponse.json({ aisles: result.rows })
  } catch (error) {
    return NextResponse.json({ aisles: [] })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await ensureAislesTable()

    const body = await request.json()
    const crypto = require('crypto')
    const id = crypto.randomUUID()

    const result = await pool.query(`
      INSERT INTO "WarehouseAisle" (id, "zoneId", "warehouseId", name, code, "aisleType", "isActive", "organizationId", "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
      RETURNING *
    `, [id, body.zoneId, body.warehouseId, body.name, body.code || 'AISLE-' + Date.now().toString().slice(-4), body.aisleType || 'PICKING', body.isActive !== false, session.organizationId])

    return NextResponse.json({ aisle: result.rows[0] }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    await pool.query(`DELETE FROM "WarehouseAisle" WHERE id = $1 AND "organizationId" = $2`, [id, session.organizationId]).catch(() => {})

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
  }
}