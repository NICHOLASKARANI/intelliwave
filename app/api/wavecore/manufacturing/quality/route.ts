export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth' from '@/lib/wavecore/db'

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const result = await pool.query(`SELECT * FROM "QualityCheck" ORDER BY "createdAt" DESC LIMIT 50`)
    return NextResponse.json({ checks: result.rows })
  } catch (error: any) {
    console.error('Quality GET:', (error as Error).message)
    return NextResponse.json({ checks: [] })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const result = await pool.query(
      `INSERT INTO "QualityCheck" ("id", "type", "result", "inspectedQty", "passedQty", "rejectedQty", "workOrderId", "organizationId", "createdAt", "updatedAt") 
       VALUES (gen_random_uuid()::text, 'FINAL', $1, 0, 0, 0, 'wo-1', 'org-1', NOW(), NOW()) 
       RETURNING *`,
      [body.result || 'PASSED']
    )

    return NextResponse.json({ success: true, check: result.rows[0] }, { status: 201 })
  } catch (error: any) {
    console.error('Quality POST:', (error as Error).message)
    return NextResponse.json({ error: 'Failed: ' + (error as Error).message }, { status: 500 })
  }
}