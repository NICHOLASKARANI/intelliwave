export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'

export async function GET(request: NextRequest) {
  try {
    const result = await pool.query(`SELECT * FROM "WorkCenter" ORDER BY "createdAt" DESC LIMIT 100`)
    return NextResponse.json({ centers: result.rows })
  } catch (error: any) {
    console.error('Centers GET:', error.message)
    return NextResponse.json({ centers: [] })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const result = await pool.query(
      `INSERT INTO "WorkCenter" ("id", "name", "capacity", "efficiency", "organizationId", "createdAt") 
       VALUES (gen_random_uuid()::text, $1, $2, $3, $4, NOW()) 
       RETURNING "id", "name", "capacity", "efficiency"`,
      [body.name, parseFloat(body.capacity) || 0, parseFloat(body.efficiency) || 100, body.organizationId || 'org-1']
    )

    return NextResponse.json({ success: true, center: result.rows[0] }, { status: 201 })
  } catch (error: any) {
    console.error('Center POST:', error.message)
    return NextResponse.json({ error: 'Failed: ' + error.message }, { status: 500 })
  }
}