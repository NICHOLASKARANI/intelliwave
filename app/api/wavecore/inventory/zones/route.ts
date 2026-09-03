export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/wavecore/auth'
import { pool } from '@/lib/wavecore/db'

async function ensureZonesTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS "WarehouseZone" (
      id TEXT PRIMARY KEY,
      "warehouseId" TEXT NOT NULL,
      name TEXT NOT NULL,
      code TEXT,
      "zoneType" TEXT DEFAULT 'STORAGE',
      "temperature" TEXT,
      "isActive" BOOLEAN DEFAULT true,
      "organizationId" TEXT NOT NULL,
      "createdAt" TIMESTAMP DEFAULT NOW(),
      "updatedAt" TIMESTAMP DEFAULT NOW()
    )
  `).catch(() => {})
  await pool.query(`CREATE INDEX IF NOT EXISTS "idx_zone_warehouse" ON "WarehouseZone" ("warehouseId")`).catch(() => {})
}

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await ensureZonesTable()

    const result = await pool.query(`
      SELECT wz.*, 
        (SELECT COUNT(*) FROM "WarehouseAisle" wa WHERE wa."zoneId" = wz.id) as "aisleCount",
        (SELECT COUNT(*) FROM "Bin" b WHERE b."zoneId" = wz.id) as "binCount"
      FROM "WarehouseZone" wz
      WHERE wz."organizationId" = $1
      ORDER BY wz.name ASC
    `, [session.organizationId]).catch(() => ({ rows: [] }))

    return NextResponse.json({ zones: result.rows })
  } catch (error) {
    return NextResponse.json({ zones: [] })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await ensureZonesTable()

    const body = await request.json()
    const crypto = require('crypto')
    const id = crypto.randomUUID()

    const result = await pool.query(`
      INSERT INTO "WarehouseZone" (id, "warehouseId", name, code, "zoneType", "temperature", "isActive", "organizationId", "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
      RETURNING *
    `, [id, body.warehouseId, body.name, body.code || 'ZONE-' + Date.now().toString().slice(-4), body.zoneType || 'STORAGE', body.temperature, body.isActive !== false, session.organizationId])

    return NextResponse.json({ zone: result.rows[0] }, { status: 201 })
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

    await pool.query(`DELETE FROM "WarehouseZone" WHERE id = $1 AND "organizationId" = $2`, [id, session.organizationId]).catch(() => {})

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
  }
}