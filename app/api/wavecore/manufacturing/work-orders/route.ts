export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant()
    const result = await pool.query(
      `SELECT * FROM "WorkOrder" WHERE "organizationId" = $1 ORDER BY "createdAt" DESC`,
      [session.organizationId]
    )
    return NextResponse.json({ workOrders: result.rows })
  } catch (error: any) {
    console.error('WorkOrder GET error:', error.message)
    return NextResponse.json({ workOrders: [] })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireTenant()
    const body = await request.json()
    const number = 'WO-' + Date.now().toString().slice(-6)

    const result = await pool.query(
      `INSERT INTO "WorkOrder" (id, number, "productName", quantity, priority, status, "organizationId", "createdAt") 
       VALUES (gen_random_uuid()::text, $1, $2, $3, $4, 'DRAFT', $5, NOW()) 
       RETURNING id, number, "productName", quantity, priority, status`,
      [number, body.productName, parseInt(body.quantity) || 1, body.priority || 'MEDIUM', session.organizationId]
    )

    return NextResponse.json({ success: true, workOrder: result.rows[0] }, { status: 201 })
  } catch (error: any) {
    console.error('WorkOrder POST error:', error.message)
    return NextResponse.json({ error: 'Failed to create work order' }, { status: 500 })
  }
}