export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant()
    const result = await pool.query(
      'SELECT * FROM "BillOfMaterial" WHERE "organizationId" = $1 ORDER BY "createdAt" DESC',
      [session.organizationId]
    )
    return NextResponse.json({ boms: result.rows })
  } catch { return NextResponse.json({ boms: [] }) }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireTenant()
    const body = await request.json()

    const result = await pool.query(
      'INSERT INTO "BillOfMaterial" (id, name, "productName", quantity, "organizationId", "createdAt") VALUES (gen_random_uuid()::text, $1, $2, $3, $4, NOW()) RETURNING id, name',
      [body.name, body.productName, body.quantity || 1, session.organizationId]
    )
    return NextResponse.json({ success: true, bom: result.rows[0] }, { status: 201 })
  } catch (error: any) {
    console.error('BOM POST:', error.message)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}