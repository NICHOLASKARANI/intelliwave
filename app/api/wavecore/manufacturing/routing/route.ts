export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'

export async function GET(request: NextRequest) {
  try {
    const result = await pool.query(`SELECT * FROM "Routing" ORDER BY "createdAt" DESC LIMIT 50`)
    return NextResponse.json({ routes: result.rows })
  } catch (error: any) {
    console.error('Routing GET:', (error as Error).message)
    return NextResponse.json({ routes: [] })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const result = await pool.query(
      `INSERT INTO "Routing" ("id", "name", "code", "productId", "organizationId", "createdAt", "updatedAt") 
       VALUES (gen_random_uuid()::text, $1, $2, 'product-1', 'org-1', NOW(), NOW()) 
       RETURNING *`,
      [body.name, 'RT-' + Date.now().toString().slice(-6)]
    )

    return NextResponse.json({ success: true, route: result.rows[0] }, { status: 201 })
  } catch (error: any) {
    console.error('Routing POST:', (error as Error).message)
    return NextResponse.json({ error: 'Failed: ' + (error as Error).message }, { status: 500 })
  }
}