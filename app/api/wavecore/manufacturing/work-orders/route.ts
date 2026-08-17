export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'

function getOrgId(request: NextRequest): string | null {
  const sessionToken = request.cookies.get('wavecore_session')?.value
  if (!sessionToken) return null
  return null // Will be resolved in query
}

export async function GET(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('wavecore_session')?.value

    let orgId = ''
    if (sessionToken) {
      const session = await pool.query(
        'SELECT s."userId" FROM "Session" s WHERE s."sessionToken" = $1',
        [sessionToken]
      )
      if (session.rows.length > 0) {
        const org = await pool.query(
          'SELECT om."A" as org_id FROM "_OrganizationMembers" om WHERE om."B" = $1 LIMIT 1',
          [session.rows[0].userId]
        )
        if (org.rows.length > 0) orgId = org.rows[0].org_id
      }
    }

    if (!orgId) {
      const org = await pool.query('SELECT id FROM "Organization" LIMIT 1')
      if (org.rows.length > 0) orgId = org.rows[0].id
    }

    const result = await pool.query(
      'SELECT * FROM "WorkOrder" WHERE "organizationId" = $1 ORDER BY "createdAt" DESC',
      [orgId]
    )
    return NextResponse.json({ workOrders: result.rows })
  } catch (error: any) {
    console.error('WorkOrder GET:', error.message)
    return NextResponse.json({ workOrders: [] })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const sessionToken = request.cookies.get('wavecore_session')?.value

    let orgId = ''
    if (sessionToken) {
      const session = await pool.query(
        'SELECT s."userId" FROM "Session" s WHERE s."sessionToken" = $1',
        [sessionToken]
      )
      if (session.rows.length > 0) {
        const org = await pool.query(
          'SELECT om."A" as org_id FROM "_OrganizationMembers" om WHERE om."B" = $1 LIMIT 1',
          [session.rows[0].userId]
        )
        if (org.rows.length > 0) orgId = org.rows[0].org_id
      }
    }

    if (!orgId) {
      const org = await pool.query('SELECT id FROM "Organization" LIMIT 1')
      if (org.rows.length > 0) orgId = org.rows[0].id
    }

    const number = 'WO-' + Date.now().toString().slice(-6)
    const result = await pool.query(
      `INSERT INTO "WorkOrder" (id, number, "productName", quantity, priority, status, "organizationId", "createdAt") 
       VALUES (gen_random_uuid()::text, $1, $2, $3, $4, 'DRAFT', $5, NOW()) 
       RETURNING id, number, "productName", quantity, priority, status`,
      [number, body.productName, parseInt(body.quantity) || 1, body.priority || 'MEDIUM', orgId]
    )

    return NextResponse.json({ success: true, workOrder: result.rows[0] }, { status: 201 })
  } catch (error: any) {
    console.error('WorkOrder POST:', error.message)
    return NextResponse.json({ error: 'Failed: ' + error.message }, { status: 500 })
  }
}