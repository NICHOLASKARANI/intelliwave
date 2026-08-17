export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'

export async function GET(request: NextRequest) {
  try {
    const result = await pool.query(`SELECT * FROM "BillOfMaterial" ORDER BY "createdAt" DESC LIMIT 50`)
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
      `INSERT INTO "BillOfMaterial" ("id", "name", "code", "productId", "quantity", "isActive", "organizationId", "createdAt", "updatedAt") 
       VALUES (gen_random_uuid()::text, $1, $2, 'product-1', $3, true, 'org-1', NOW(), NOW()) 
       RETURNING *`,
      [body.name, 'BOM-' + Date.now().toString().slice(-6), parseInt(body.quantity) || 1]
    )

    return NextResponse.json({ success: true, bom: result.rows[0] }, { status: 201 })
  } catch (error: any) {
    console.error('BOM POST:', error.message)
    return NextResponse.json({ error: 'Failed: ' + error.message }, { status: 500 })
  }
}