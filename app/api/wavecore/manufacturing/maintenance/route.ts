export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'

export async function GET(request: NextRequest) {
  try {
    const result = await pool.query(`SELECT * FROM "MaintenanceRequest" ORDER BY "createdAt" DESC LIMIT 50`)
    return NextResponse.json({ requests: result.rows })
  } catch (error: any) {
    console.error('Maintenance GET:', (error as Error).message)
    return NextResponse.json({ requests: [] })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const result = await pool.query(
      `INSERT INTO "MaintenanceRequest" ("id", "number", "type", "status", "description", "assetName", "assetCode", "priority", "requestedDate", "organizationId", "createdAt", "updatedAt") 
       VALUES (gen_random_uuid()::text, $1, 'CORRECTIVE', 'REQUESTED', $2, $3, null, $4, NOW(), 'org-1', NOW(), NOW()) 
       RETURNING *`,
      ['MR-' + Date.now().toString().slice(-6), body.description || null, body.assetName, body.priority || 'MEDIUM']
    )

    return NextResponse.json({ success: true, request: result.rows[0] }, { status: 201 })
  } catch (error: any) {
    console.error('Maintenance POST:', (error as Error).message)
    return NextResponse.json({ error: 'Failed: ' + (error as Error).message }, { status: 500 })
  }
}