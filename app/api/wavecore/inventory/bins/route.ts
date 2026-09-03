export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/wavecore/auth'
import { pool } from '@/lib/wavecore/db'

async function ensureBinsTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS "Bin" (
      id TEXT PRIMARY KEY,
      "rackId" TEXT,
      "zoneId" TEXT,
      "warehouseId" TEXT NOT NULL,
      name TEXT NOT NULL,
      code TEXT,
      "binType" TEXT DEFAULT 'PICKING',
      "capacity" DECIMAL(15,2) DEFAULT 0,
      "weightCapacity" DECIMAL(15,2) DEFAULT 0,
      "volumeCapacity" DECIMAL(15,2) DEFAULT 0,
      "currentOccupancy" DECIMAL(15,2) DEFAULT 0,
      "temperature" TEXT,
      "hazardClass" TEXT,
      "isActive" BOOLEAN DEFAULT true,
      "organizationId" TEXT NOT NULL,
      "createdAt" TIMESTAMP DEFAULT NOW(),
      "updatedAt" TIMESTAMP DEFAULT NOW()
    )
  `).catch(() => {})
  await pool.query(`CREATE INDEX IF NOT EXISTS "idx_bin_warehouse" ON "Bin" ("warehouseId")`).catch(() => {})
  await pool.query(`CREATE INDEX IF NOT EXISTS "idx_bin_rack" ON "Bin" ("rackId")`).catch(() => {})
}

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await ensureBinsTable()

    const result = await pool.query(`
      SELECT b.*, 
        (SELECT COALESCE(SUM(sq.quantity), 0) FROM "StockQuantity" sq WHERE sq."locationId" = b.id) as "currentStock"
      FROM "Bin" b
      WHERE b."organizationId" = $1
      ORDER BY b.name ASC
    `, [session.organizationId]).catch(() => ({ rows: [] }))

    return NextResponse.json({ bins: result.rows })
  } catch (error) {
    return NextResponse.json({ bins: [] })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await ensureBinsTable()

    const body = await request.json()
    const crypto = require('crypto')
    const id = crypto.randomUUID()

    const result = await pool.query(`
      INSERT INTO "Bin" (id, "rackId", "zoneId", "warehouseId", name, code, "binType", "capacity", "weightCapacity", "volumeCapacity", "temperature", "hazardClass", "isActive", "organizationId", "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW(), NOW())
      RETURNING *
    `, [id, body.rackId, body.zoneId, body.warehouseId, body.name, body.code || 'BIN-' + Date.now().toString().slice(-4), body.binType || 'PICKING', body.capacity || 0, body.weightCapacity || 0, body.volumeCapacity || 0, body.temperature, body.hazardClass, body.isActive !== false, session.organizationId])

    return NextResponse.json({ bin: result.rows[0] }, { status: 201 })
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

    await pool.query(`DELETE FROM "Bin" WHERE id = $1 AND "organizationId" = $2`, [id, session.organizationId]).catch(() => {})

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
  }
}