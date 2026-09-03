export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/wavecore/auth'
import { pool } from '@/lib/wavecore/db'

async function ensureRacksTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS "Rack" (
      id TEXT PRIMARY KEY,
      "aisleId" TEXT NOT NULL,
      "warehouseId" TEXT NOT NULL,
      name TEXT NOT NULL,
      code TEXT,
      "rackType" TEXT DEFAULT 'STANDARD',
      "capacity" INTEGER DEFAULT 100,
      "isActive" BOOLEAN DEFAULT true,
      "organizationId" TEXT NOT NULL,
      "createdAt" TIMESTAMP DEFAULT NOW(),
      "updatedAt" TIMESTAMP DEFAULT NOW()
    )
  `).catch(() => {})
  await pool.query(`CREATE INDEX IF NOT EXISTS "idx_rack_aisle" ON "Rack" ("aisleId")`).catch(() => {})
}

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await ensureRacksTable()

    const result = await pool.query(`
      SELECT r.*, 
        (SELECT COUNT(*) FROM "Bin" b WHERE b."rackId" = r.id) as "binCount"
      FROM "Rack" r
      WHERE r."organizationId" = $1
      ORDER BY r.name ASC
    `, [session.organizationId]).catch(() => ({ rows: [] }))

    return NextResponse.json({ racks: result.rows })
  } catch (error) {
    return NextResponse.json({ racks: [] })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await ensureRacksTable()

    const body = await request.json()
    const crypto = require('crypto')
    const id = crypto.randomUUID()

    const result = await pool.query(`
      INSERT INTO "Rack" (id, "aisleId", "warehouseId", name, code, "rackType", "capacity", "isActive", "organizationId", "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
      RETURNING *
    `, [id, body.aisleId, body.warehouseId, body.name, body.code || 'RACK-' + Date.now().toString().slice(-4), body.rackType || 'STANDARD', body.capacity || 100, body.isActive !== false, session.organizationId])

    return NextResponse.json({ rack: result.rows[0] }, { status: 201 })
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

    await pool.query(`DELETE FROM "Rack" WHERE id = $1 AND "organizationId" = $2`, [id, session.organizationId]).catch(() => {})

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
  }
}