export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'

export async function GET(request: NextRequest) {
  try {
    const result = await pool.query(`SELECT * FROM "BillOfMaterial" ORDER BY "createdAt" DESC LIMIT 100`)
    return NextResponse.json({ boms: result.rows })
  } catch (error: any) {
    console.error('BOM GET:', error.message)
    return NextResponse.json({ boms: [] })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const result = await pool.query(
      `INSERT INTO "BillOfMaterial" ("id", "name", "productName", "quantity", "organizationId", "createdAt") 
       VALUES (gen_random_uuid()::text, $1, $2, $3, $4, NOW()) 
       RETURNING "id", "name", "productName", "quantity"`,
      [body.name, body.productName, parseInt(body.quantity) || 1, body.organizationId || 'org-1']
    )

    return NextResponse.json({ success: true, bom: result.rows[0] }, { status: 201 })
  } catch (error: any) {
    console.error('BOM POST:', error.message)
    return NextResponse.json({ error: 'Failed: ' + error.message }, { status: 500 })
  }
}