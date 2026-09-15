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

    let sql = `SELECT * FROM "WorkCenter" WHERE "organizationId" = $1`
    const params: any[] = [session.organizationId]
    if (search) {
      sql += ` AND (name ILIKE $2 OR code ILIKE $2)`
      params.push(`%${search}%`)
    }
    sql += ` ORDER BY "createdAt" DESC`

    const result = await pool.query(sql, params)
    const centers = result.rows

    // Compute load for each center separately (avoids risky JOIN)
    const ids = centers.map(c => c.id)
    const names = centers.map(c => c.name)
    let loadMap: Record<string, { cnt: number; openQty: number }> = {}

    if (ids.length > 0 || names.length > 0) {
      try {
        const loadRes = await pool.query(
          `SELECT "workCenterId", COUNT(*)::int AS cnt,
                  SUM(quantity - COALESCE("completedQty", 0))::float AS "openQty"
           FROM "WorkOrder"
           WHERE "organizationId" = $1
             AND status NOT IN ('COMPLETED', 'CANCELLED')
             AND ("workCenterId" = ANY($2::text[]) OR "workCenterId" = ANY($3::text[]))
           GROUP BY "workCenterId"`,
          [session.organizationId, ids, names]
        )
        for (const row of loadRes.rows) {
          loadMap[row.workCenterId] = { cnt: Number(row.cnt), openQty: Number(row.openQty || 0) }
        }
      } catch (e) {
        console.error('Load calc error (non-fatal):', e)
      }
    }

    const enriched = centers.map(c => ({
      ...c,
      activeWorkOrders: loadMap[c.id]?.cnt ?? loadMap[c.name]?.cnt ?? 0,
      openQty: loadMap[c.id]?.openQty ?? loadMap[c.name]?.openQty ?? 0,
    }))

    const totalCapacity = enriched.reduce((s, c) => s + Number(c.capacity || 0), 0)
    const totalLoad = enriched.reduce((s, c) => s + Number(c.openQty || 0), 0)
    const avgEfficiency = enriched.length > 0
      ? Math.round(enriched.reduce((s, c) => s + Number(c.efficiency || 0), 0) / enriched.length * 100)
      : 0
    const avgCost = enriched.length > 0
      ? Math.round(enriched.reduce((s, c) => s + Number(c.costPerHour || 0), 0) / enriched.length)
      : 0

    const summary = {
      total: enriched.length,
      active: enriched.filter(c => Number(c.activeWorkOrders) > 0).length,
      idle: enriched.filter(c => Number(c.activeWorkOrders) === 0).length,
      totalCapacity,
      totalLoad,
      utilization: totalCapacity > 0 ? Math.round((totalLoad / totalCapacity) * 100) : 0,
      avgEfficiency: avgEfficiency + '%',
      avgCost,
      totalOpenQty: totalLoad,
    }

    return NextResponse.json({ centers: enriched, summary })
  } catch (error) {
    console.error('Centers GET error:', error)
    return NextResponse.json({ centers: [], summary: {}, error: (error as Error).message })
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