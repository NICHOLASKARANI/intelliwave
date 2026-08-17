export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant()
    const result = await pool.query(
      `SELECT * FROM "MaintenanceRequest" WHERE "organizationId" = $1 ORDER BY "createdAt" DESC`,
      [session.organizationId]
    )
    return NextResponse.json({ requests: result.rows })
  } catch (error: any) {
    console.error('Maintenance GET error:', error.message)
    return NextResponse.json({ requests: [] })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireTenant()
    const body = await request.json()

    const result = await pool.query(
      `INSERT INTO "MaintenanceRequest" (id, "assetName", description, priority, status, "organizationId", "createdAt") 
       VALUES (gen_random_uuid()::text, $1, $2, $3, 'REQUESTED', $4, NOW()) 
       RETURNING id, "assetName", priority, status`,
      [body.assetName, body.description || null, body.priority || 'MEDIUM', session.organizationId]
    )

    return NextResponse.json({ success: true, request: result.rows[0] }, { status: 201 })
  } catch (error: any) {
    console.error('Maintenance POST error:', error.message)
    return NextResponse.json({ error: 'Failed to submit request' }, { status: 500 })
  }
}