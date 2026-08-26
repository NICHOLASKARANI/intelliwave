export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const result = await pool.query(`SELECT * FROM "BillOfMaterial" ORDER BY "createdAt" DESC LIMIT 50`)
    return NextResponse.json({ boms: result.rows })
  } catch (error: any) {
    console.error('BOM GET:', (error as Error).message)
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
    console.error('BOM POST:', (error as Error).message)
    return NextResponse.json({ error: 'Failed: ' + (error as Error).message }, { status: 500 })
  }
}