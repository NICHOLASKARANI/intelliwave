export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'

export async function GET(request: NextRequest) {
  try {
    const result = await pool.query(`SELECT * FROM "WorkOrder" ORDER BY "createdAt" DESC LIMIT 50`)
    return NextResponse.json({ workOrders: result.rows })
  } catch (error: any) {
    console.error('WorkOrder GET:', error.message)
    return NextResponse.json({ workOrders: [] })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const number = 'WO-' + Date.now().toString().slice(-6)

    const result = await pool.query(
      `INSERT INTO "WorkOrder" ("id", "number", "type", "status", "quantity", "completedQty", "priority", "productId", "organizationId", "createdAt", "updatedAt") 
       VALUES (gen_random_uuid()::text, $1, 'MANUFACTURING', 'DRAFT', $2, 0, $3, 'product-1', 'org-1', NOW(), NOW()) 
       RETURNING *`,
      [number, parseInt(body.quantity) || 1, body.priority || 'MEDIUM']
    )

    return NextResponse.json({ success: true, workOrder: result.rows[0] }, { status: 201 })
  } catch (error: any) {
    console.error('WorkOrder POST:', error.message)
    return NextResponse.json({ error: 'Failed: ' + error.message }, { status: 500 })
  }
}