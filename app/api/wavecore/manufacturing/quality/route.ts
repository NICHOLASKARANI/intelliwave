export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'

export async function GET(request: NextRequest) {
  try {
    const result = await pool.query(`SELECT * FROM "QualityCheck" ORDER BY "createdAt" DESC LIMIT 100`)
    return NextResponse.json({ checks: result.rows })
  } catch (error: any) {
    console.error('Quality GET:', error.message)
    return NextResponse.json({ checks: [] })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const result = await pool.query(
      `INSERT INTO "QualityCheck" ("id", "workOrder", "result", "organizationId", "createdAt") 
       VALUES (gen_random_uuid()::text, $1, $2, $3, NOW()) 
       RETURNING "id", "workOrder", "result"`,
      [body.workOrder, body.result || 'PASSED', body.organizationId || 'org-1']
    )

    return NextResponse.json({ success: true, check: result.rows[0] }, { status: 201 })
  } catch (error: any) {
    console.error('Quality POST:', error.message)
    return NextResponse.json({ error: 'Failed: ' + error.message }, { status: 500 })
  }
}