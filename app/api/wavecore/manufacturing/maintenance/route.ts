export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'

export async function GET(request: NextRequest) {
  try {
    const result = await pool.query(`SELECT * FROM "MaintenanceRequest" ORDER BY "createdAt" DESC LIMIT 100`)
    return NextResponse.json({ requests: result.rows })
  } catch (error: any) {
    console.error('Maintenance GET:', error.message)
    return NextResponse.json({ requests: [] })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const result = await pool.query(
      `INSERT INTO "MaintenanceRequest" ("id", "assetName", "description", "priority", "status", "organizationId", "createdAt") 
       VALUES (gen_random_uuid()::text, $1, $2, $3, 'REQUESTED', $4, NOW()) 
       RETURNING "id", "assetName", "priority", "status"`,
      [body.assetName, body.description || null, body.priority || 'MEDIUM', body.organizationId || 'org-1']
    )

    return NextResponse.json({ success: true, request: result.rows[0] }, { status: 201 })
  } catch (error: any) {
    console.error('Maintenance POST:', error.message)
    return NextResponse.json({ error: 'Failed: ' + error.message }, { status: 500 })
  }
}