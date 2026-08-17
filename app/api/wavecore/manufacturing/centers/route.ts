export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant()
    await pool.query('CREATE TABLE IF NOT EXISTS "WorkCenter" ("id" TEXT NOT NULL, "name" TEXT NOT NULL, "capacity" DOUBLE PRECISION DEFAULT 0, "efficiency" DOUBLE PRECISION DEFAULT 100, "organizationId" TEXT NOT NULL, "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "WorkCenter_pkey" PRIMARY KEY ("id"))')
    const result = await pool.query('SELECT * FROM "WorkCenter" WHERE "organizationId" = $1 ORDER BY "createdAt" DESC', [session.organizationId])
    return NextResponse.json({ centers: result.rows })
  } catch { return NextResponse.json({ centers: [] }) }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireTenant()
    const body = await request.json()
    await pool.query('CREATE TABLE IF NOT EXISTS "WorkCenter" ("id" TEXT NOT NULL, "name" TEXT NOT NULL, "capacity" DOUBLE PRECISION DEFAULT 0, "efficiency" DOUBLE PRECISION DEFAULT 100, "organizationId" TEXT NOT NULL, "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "WorkCenter_pkey" PRIMARY KEY ("id"))')
    await pool.query(
      'INSERT INTO "WorkCenter" (id, name, capacity, efficiency, "organizationId", "createdAt") VALUES (gen_random_uuid()::text, $1, $2, $3, $4, NOW())',
      [body.name, body.capacity || 0, body.efficiency || 100, session.organizationId]
    )
    return NextResponse.json({ success: true }, { status: 201 })
  } catch (error: any) {
    console.error('Center POST:', error.message)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}