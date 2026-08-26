export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const result = await pool.query(`SELECT * FROM "WorkOrder" ORDER BY "createdAt" DESC LIMIT 50`)
    return NextResponse.json({ workOrders: result.rows })
  } catch (error: any) {
    console.error('WorkOrder GET:', (error as Error).message)
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
    console.error('WorkOrder POST:', (error as Error).message)
    return NextResponse.json({ error: 'Failed: ' + (error as Error).message }, { status: 500 })
  }
}