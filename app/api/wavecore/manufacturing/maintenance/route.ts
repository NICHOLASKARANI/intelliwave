export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant()
    await pool.query('CREATE TABLE IF NOT EXISTS "MaintenanceRequest" ("id" TEXT NOT NULL, "assetName" TEXT NOT NULL, "description" TEXT, "priority" TEXT DEFAULT ''MEDIUM'', "status" TEXT DEFAULT ''REQUESTED'', "organizationId" TEXT NOT NULL, "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "MaintenanceRequest_pkey" PRIMARY KEY ("id"))')
    const result = await pool.query('SELECT * FROM "MaintenanceRequest" WHERE "organizationId" = $1 ORDER BY "createdAt" DESC', [session.organizationId])
    return NextResponse.json({ requests: result.rows })
  } catch { return NextResponse.json({ requests: [] }) }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireTenant()
    const body = await request.json()
    await pool.query('CREATE TABLE IF NOT EXISTS "MaintenanceRequest" ("id" TEXT NOT NULL, "assetName" TEXT NOT NULL, "description" TEXT, "priority" TEXT DEFAULT ''MEDIUM'', "status" TEXT DEFAULT ''REQUESTED'', "organizationId" TEXT NOT NULL, "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "MaintenanceRequest_pkey" PRIMARY KEY ("id"))')
    await pool.query(
      'INSERT INTO "MaintenanceRequest" (id, "assetName", description, priority, status, "organizationId", "createdAt") VALUES (gen_random_uuid()::text, $1, $2, $3, ''REQUESTED'', $4, NOW())',
      [body.assetName, body.description || null, body.priority || 'MEDIUM', session.organizationId]
    )
    return NextResponse.json({ success: true }, { status: 201 })
  } catch (error: any) {
    console.error('Maintenance POST:', error.message)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}