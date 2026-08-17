export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant()
    const result = await pool.query(
      `SELECT * FROM "QualityCheck" WHERE "organizationId" = $1 ORDER BY "createdAt" DESC`,
      [session.organizationId]
    )
    return NextResponse.json({ checks: result.rows })
  } catch (error: any) {
    console.error('Quality GET error:', error.message)
    return NextResponse.json({ checks: [] })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireTenant()
    const body = await request.json()

    const result = await pool.query(
      `INSERT INTO "QualityCheck" (id, "workOrder", result, "organizationId", "createdAt") 
       VALUES (gen_random_uuid()::text, $1, $2, $3, NOW()) 
       RETURNING id, "workOrder", result`,
      [body.workOrder, body.result || 'PASSED', session.organizationId]
    )

    return NextResponse.json({ success: true, check: result.rows[0] }, { status: 201 })
  } catch (error: any) {
    console.error('Quality POST error:', error.message)
    return NextResponse.json({ error: 'Failed to record check' }, { status: 500 })
  }
}