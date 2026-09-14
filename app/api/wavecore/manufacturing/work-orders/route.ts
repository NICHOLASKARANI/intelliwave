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
    const limit = Math.min(Number(searchParams.get('limit') || 200), 500)

    let sql = `
      SELECT wo.*,
             p.name AS "productName",
             p.sku AS "productSku",
             wc.name AS "workCenterName",
             b.name AS "bomName"
      FROM "WorkOrder" wo
      LEFT JOIN "Product" p ON p.id = wo."productId"
      LEFT JOIN "WorkCenter" wc ON wc.id = wo."workCenterId"
      LEFT JOIN "BillOfMaterial" b ON b.id = wo."bomId"
      WHERE wo."organizationId" = $1
    `
    const params: any[] = [session.organizationId]
    let idx = 2

    if (status && status !== 'ALL') { sql += ` AND wo.status = $${idx++}`; params.push(status) }
    if (type && type !== 'ALL') { sql += ` AND wo.type = $${idx++}`; params.push(type) }
    if (priority && priority !== 'ALL') { sql += ` AND wo.priority = $${idx++}`; params.push(priority) }
    if (search) {
      sql += ` AND (wo.number ILIKE $${idx} OR p.name ILIKE $${idx})`
      params.push(`%${search}%`); idx++
    }

    sql += ` ORDER BY wo."createdAt" DESC LIMIT $${idx}`
    params.push(limit)

    const result = await pool.query(sql, params)
    const orders = result.rows

    const now = new Date()
    const summary = {
      total: orders.length,
      draft: orders.filter(o => o.status === 'DRAFT').length,
      released: orders.filter(o => o.status === 'RELEASED').length,
      inProgress: orders.filter(o => o.status === 'IN_PROGRESS').length,
      completed: orders.filter(o => o.status === 'COMPLETED').length,
      cancelled: orders.filter(o => o.status === 'CANCELLED').length,
      overdue: orders.filter(o => o.endDate && new Date(o.endDate) < now && o.status !== 'COMPLETED').length,
      totalQty: orders.reduce((s, o) => s + Number(o.quantity || 0), 0),
      completedQty: orders.reduce((s, o) => s + Number(o.completedQty || 0), 0),
    }
    const onTimeBase = orders.filter(o => o.status === 'COMPLETED').length
    const onTimeHit = orders.filter(o => o.status === 'COMPLETED' && o.endDate && new Date(o.updatedAt) <= new Date(o.endDate)).length
    summary['onTimePct'] = onTimeBase > 0 ? Math.round((onTimeHit / onTimeBase) * 100) : 100

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
    if (!body.productId) return NextResponse.json({ error: 'Product is required' }, { status: 400 })
    const qty = Number(body.quantity || 0)
    if (qty <= 0) return NextResponse.json({ error: 'Quantity must be > 0' }, { status: 400 })

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
        body.productId,
        body.bomId || null,
        body.workCenterId || null,
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