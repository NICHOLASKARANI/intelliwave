export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const result = await pool.query(
      `SELECT * FROM "WorkOrder" WHERE "organizationId" = $1 ORDER BY "createdAt" DESC`,
      [session.organizationId]
    )
    return NextResponse.json({ workOrders: result.rows })
  } catch (error) {
    console.error('Work orders GET error:', error)
    return NextResponse.json({ workOrders: [] })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const body = await request.json()
    const crypto = require('crypto')
    const id = crypto.randomUUID()
    const number = 'WO-' + Date.now().toString().slice(-8)
    const result = await pool.query(
      `INSERT INTO "WorkOrder" (id, number, type, status, quantity, "completedQty", priority, notes, "productId", "organizationId", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW()) RETURNING *`,
      [id, number, body.type || 'MANUFACTURING', body.status || 'DRAFT', Number(body.quantity || 1), 0, body.priority || 'MEDIUM', body.notes || null, body.productId || null, session.organizationId]
    )
    return NextResponse.json({ workOrder: result.rows[0] }, { status: 201 })
  } catch (error) {
    console.error('Work orders POST error:', error)
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    await pool.query(`DELETE FROM "WorkOrder" WHERE id = $1 AND "organizationId" = $2`, [id, session.organizationId])
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
  }
}