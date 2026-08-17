export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant()
    await pool.query('CREATE TABLE IF NOT EXISTS "QualityCheck" ("id" TEXT NOT NULL, "workOrder" TEXT NOT NULL, "result" TEXT DEFAULT ''PASSED'', "organizationId" TEXT NOT NULL, "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "QualityCheck_pkey" PRIMARY KEY ("id"))')
    const result = await pool.query('SELECT * FROM "QualityCheck" WHERE "organizationId" = $1 ORDER BY "createdAt" DESC', [session.organizationId])
    return NextResponse.json({ checks: result.rows })
  } catch { return NextResponse.json({ checks: [] }) }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireTenant()
    const body = await request.json()
    await pool.query('CREATE TABLE IF NOT EXISTS "QualityCheck" ("id" TEXT NOT NULL, "workOrder" TEXT NOT NULL, "result" TEXT DEFAULT ''PASSED'', "organizationId" TEXT NOT NULL, "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "QualityCheck_pkey" PRIMARY KEY ("id"))')
    await pool.query(
      'INSERT INTO "QualityCheck" (id, "workOrder", result, "organizationId", "createdAt") VALUES (gen_random_uuid()::text, $1, $2, $3, NOW())',
      [body.workOrder, body.result || 'PASSED', session.organizationId]
    )
    return NextResponse.json({ success: true }, { status: 201 })
  } catch (error: any) {
    console.error('Quality POST:', error.message)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}