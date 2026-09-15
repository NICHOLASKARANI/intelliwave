export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const type = searchParams.get('type')
    const priority = searchParams.get('priority')
    const search = searchParams.get('search')

    let sql = `SELECT * FROM "WorkOrder" WHERE "organizationId" = $1`
    const params: any[] = [session.organizationId]
    let idx = 2

    if (status && status !== 'ALL') { sql += ` AND status = $${idx++}`; params.push(status) }
    if (type && type !== 'ALL') { sql += ` AND type = $${idx++}`; params.push(type) }
    if (priority && priority !== 'ALL') { sql += ` AND priority = $${idx++}`; params.push(priority) }
    if (search) {
      sql += ` AND (number ILIKE $${idx} OR "productId" ILIKE $${idx})`
      params.push(`%${search}%`); idx++
    }
    sql += ` ORDER BY "createdAt" DESC`

    const result = await pool.query(sql, params)
    const orders = result.rows

    const now = new Date()
    const summary = {
      total: orders.length,
      draft: orders.filter(o => o.status === 'DRAFT').length,
      released: orders.filter(o => o.status === 'RELEASED').length,
      inProgress: orders.filter(o => o.status === 'IN_PROGRESS').length,
      completed: orders.filter(o => o.status === 'COMPLETED').length,
      overdue: orders.filter(o => o.endDate && new Date(o.endDate) < now && o.status !== 'COMPLETED' && o.status !== 'CANCELLED').length,
    }

    return NextResponse.json({ workOrders: orders, summary })
  } catch (error) {
    console.error('Work orders GET error:', error)
    return NextResponse.json({ workOrders: [], summary: {} })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    if (!body.productName || !body.productName.trim()) return NextResponse.json({ error: 'Product name is required' }, { status: 400 })
    const qty = Number(body.quantity || 0)
    if (qty <= 0) return NextResponse.json({ error: 'Quantity must be > 0' }, { status: 400 })
    if (!body.workCenterName || !body.workCenterName.trim()) return NextResponse.json({ error: 'Work Center is required' }, { status: 400 })
    if (!body.bomName || !body.bomName.trim()) return NextResponse.json({ error: 'BOM is required' }, { status: 400 })

    const crypto = require('crypto')
    const id = crypto.randomUUID()
    const number = 'WO-' + new Date().getFullYear() + '-' + Math.floor(100000 + Math.random() * 900000)

    const result = await pool.query(
      `INSERT INTO "WorkOrder"
       (id, number, type, status, quantity, "completedQty", "startDate", "endDate", priority, notes,
        "productId", "bomId", "workCenterId", "organizationId", "createdAt", "updatedAt")
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,NOW(),NOW())
       RETURNING *`,
      [
        id,
        number,
        body.type || 'MANUFACTURING',
        body.status || 'DRAFT',
        qty,
        0,
        body.startDate || null,
        body.endDate || null,
        body.priority || 'MEDIUM',
        body.notes || null,
        body.productName.trim(),
        body.bomName.trim(),
        body.workCenterName.trim(),
        session.organizationId,
      ]
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
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
    await pool.query(`DELETE FROM "WorkOrder" WHERE id = $1 AND "organizationId" = $2`, [id, session.organizationId])
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
  }
}