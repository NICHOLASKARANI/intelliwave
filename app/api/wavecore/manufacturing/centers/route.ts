export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')

    let sql = `
      SELECT wc.*,
             COALESCE(wo.cnt, 0) AS "activeWorkOrders",
             COALESCE(wo.openQty, 0) AS "openQty"
      FROM "WorkCenter" wc
      LEFT JOIN (
        SELECT "workCenterId",
               COUNT(*) AS cnt,
               SUM(quantity - COALESCE("completedQty", 0)) AS "openQty"
        FROM "WorkOrder"
        WHERE status NOT IN ('COMPLETED', 'CANCELLED')
        GROUP BY "workCenterId"
      ) wo ON wo."workCenterId" = wc.id OR wo."workCenterId" = wc.name
      WHERE wc."organizationId" = $1
    `
    const params: any[] = [session.organizationId]
    if (search) {
      sql += ` AND (wc.name ILIKE $2 OR wc.code ILIKE $2)`
      params.push(`%${search}%`)
    }
    sql += ` ORDER BY wc."createdAt" DESC`

    const result = await pool.query(sql, params)
    const centers = result.rows

    const totalCapacity = centers.reduce((s, c) => s + Number(c.capacity || 0), 0)
    const totalLoad = centers.reduce((s, c) => s + Number(c.openQty || 0), 0)
    const avgEfficiency = centers.length > 0
      ? Math.round(centers.reduce((s, c) => s + Number(c.efficiency || 0), 0) / centers.length * 100)
      : 0
    const avgCost = centers.length > 0
      ? Math.round(centers.reduce((s, c) => s + Number(c.costPerHour || 0), 0) / centers.length)
      : 0

    const summary = {
      total: centers.length,
      active: centers.filter(c => Number(c.activeWorkOrders) > 0).length,
      idle: centers.filter(c => Number(c.activeWorkOrders) === 0).length,
      totalCapacity,
      totalLoad,
      utilization: totalCapacity > 0 ? Math.round((totalLoad / totalCapacity) * 100) : 0,
      avgEfficiency: avgEfficiency + '%',
      avgCost,
    }

    return NextResponse.json({ centers, summary })
  } catch (error) {
    console.error('Centers GET error:', error)
    return NextResponse.json({ centers: [], summary: {} })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    if (!body.name || !body.name.trim()) return NextResponse.json({ error: 'Work Center name is required' }, { status: 400 })

    const crypto = require('crypto')
    const id = crypto.randomUUID()
    const code = body.code || ('WC-' + Math.floor(1000 + Math.random() * 9000))

    const result = await pool.query(
      `INSERT INTO "WorkCenter"
        (id, name, code, description, capacity, efficiency, "costPerHour", "organizationId", "createdAt", "updatedAt")
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NOW(),NOW())
       RETURNING *`,
      [
        id,
        body.name.trim(),
        code,
        body.description || null,
        Number(body.capacity || 0),
        Number(body.efficiency || 0) / 100,
        Number(body.costPerHour || 0),
        session.organizationId,
      ]
    )
    return NextResponse.json({ center: result.rows[0] }, { status: 201 })
  } catch (error) {
    console.error('Centers POST error:', error)
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
    await pool.query(`DELETE FROM "WorkCenter" WHERE id = $1 AND "organizationId" = $2`, [id, session.organizationId])
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
  }
}