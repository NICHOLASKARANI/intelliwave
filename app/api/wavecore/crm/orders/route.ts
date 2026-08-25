export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    const orgId = session.organizationId

    const result = await pool.query(
      `SELECT so.*, c.name as customer_name FROM "SalesOrder" so 
       LEFT JOIN "Customer" c ON c.id = so."customerId"
       WHERE so."organizationId" = $1 ORDER BY so."createdAt" DESC LIMIT 50`,
      [orgId]
    )

    return NextResponse.json({ orders: result.rows })
  } catch (error: any) {
    console.error('Orders GET error:', (error as Error).message)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    const orgId = session.organizationId

    const body = await request.json()
    const { customerId, items } = body

    if (!customerId || !items || items.length === 0) {
      return NextResponse.json({ error: 'Customer and items required' }, { status: 400 })
    }

    const subtotal = items.reduce((sum: number, i: any) => sum + i.quantity * i.unitPrice, 0)
    const taxAmount = subtotal * 0.16
    const total = subtotal + taxAmount
    const number = 'SO-' + Date.now().toString().slice(-8)

    const result = await pool.query(
      `INSERT INTO "SalesOrder" (id, number, status, subtotal, "taxAmount", total, "customerId", "organizationId", "createdAt", "updatedAt")
       VALUES (gen_random_uuid()::text, $1, 'PENDING', $2, $3, $4, $5, $6, NOW(), NOW()) RETURNING id, number, total`,
      [number, subtotal, taxAmount, total, customerId, orgId]
    )

    return NextResponse.json({ success: true, order: result.rows[0] }, { status: 201 })
  } catch (error: any) {
    console.error('Orders POST error:', (error as Error).message)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}