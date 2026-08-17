export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant()
    const result = await pool.query(
      `SELECT * FROM "WorkCenter" WHERE "organizationId" = $1 ORDER BY "createdAt" DESC`,
      [session.organizationId]
    )
    return NextResponse.json({ centers: result.rows })
  } catch (error: any) {
    console.error('Centers GET error:', error.message)
    return NextResponse.json({ centers: [] })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireTenant()
    const body = await request.json()

    const result = await pool.query(
      `INSERT INTO "WorkCenter" (id, name, capacity, efficiency, "organizationId", "createdAt") 
       VALUES (gen_random_uuid()::text, $1, $2, $3, $4, NOW()) 
       RETURNING id, name, capacity, efficiency`,
      [body.name, parseFloat(body.capacity) || 0, parseFloat(body.efficiency) || 100, session.organizationId]
    )

    return NextResponse.json({ success: true, center: result.rows[0] }, { status: 201 })
  } catch (error: any) {
    console.error('Center POST error:', error.message)
    return NextResponse.json({ error: 'Failed to add center' }, { status: 500 })
  }
}