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
      SELECT r.*,
             COALESCE(o.cnt, 0) AS "operationCount",
             COALESCE(o.duration, 0) AS "totalDuration",
             COALESCE(o.setup, 0) AS "totalSetup"
      FROM "Routing" r
      LEFT JOIN (
        SELECT "routingId",
               COUNT(*) AS cnt,
               SUM(COALESCE("durationMinutes", 0)) AS duration,
               SUM(COALESCE("setupMinutes", 0)) AS setup
        FROM "RoutingOperation"
        GROUP BY "routingId"
      ) o ON o."routingId" = r.id
      WHERE r."organizationId" = $1
    `
    const params: any[] = [session.organizationId]
    if (search) {
      sql += ` AND (r.name ILIKE $2 OR r.code ILIKE $2 OR r."productId" ILIKE $2)`
      params.push(`%${search}%`)
    }
    sql += ` ORDER BY r."createdAt" DESC`

    const rowsRes = await pool.query(sql, params)
    const routings = rowsRes.rows

    const totalOps = routings.reduce((s, r) => s + Number(r.operationCount || 0), 0)
    const totalDuration = routings.reduce((s, r) => s + Number(r.totalDuration || 0), 0)
    const totalSetup = routings.reduce((s, r) => s + Number(r.totalSetup || 0), 0)

    const summary = {
      total: routings.length,
      withOps: routings.filter(r => Number(r.operationCount) > 0).length,
      empty: routings.filter(r => Number(r.operationCount) === 0).length,
      totalOps,
      avgOps: routings.length > 0 ? Math.round((totalOps / routings.length) * 10) / 10 : 0,
      totalDuration,
      totalSetup,
      avgDuration: routings.length > 0 ? Math.round(totalDuration / routings.length) : 0,
    }

    return NextResponse.json({ routings, summary })
  } catch (error) {
    console.error('Routing GET error:', error)
    return NextResponse.json({ routings: [], summary: {} })
  }
}

export async function POST(request: NextRequest) {
  const client = await pool.connect()
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    if (!body.name || !body.name.trim()) return NextResponse.json({ error: 'Routing name is required' }, { status: 400 })
    if (!body.productId || !body.productId.trim()) return NextResponse.json({ error: 'Product name is required' }, { status: 400 })

    const crypto = require('crypto')
    const id = crypto.randomUUID()
    const code = body.code || ('RT-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000))

    await client.query('BEGIN')

    const routingRes = await client.query(
      `INSERT INTO "Routing" (id, name, code, "productId", "organizationId", "createdAt", "updatedAt")
       VALUES ($1,$2,$3,$4,$5,NOW(),NOW()) RETURNING *`,
      [id, body.name.trim(), code, body.productId.trim(), session.organizationId]
    )

    if (Array.isArray(body.operations)) {
      let seq = 1
      for (const op of body.operations) {
        if (!op.name || !op.name.trim()) continue
        await client.query(
          `INSERT INTO "RoutingOperation"
            (id, sequence, name, description, "durationMinutes", "setupMinutes", "routingId", "workCenterId", "createdAt")
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NOW())`,
          [
            crypto.randomUUID(),
            Number(op.sequence || seq),
            op.name.trim(),
            op.description || null,
            Number(op.durationMinutes || 0),
            Number(op.setupMinutes || 0),
            id,
            op.workCenterId || null,
          ]
        )
        seq++
      }
    }

    await client.query('COMMIT')
    return NextResponse.json({ routing: routingRes.rows[0] }, { status: 201 })
  } catch (error) {
    try { await client.query('ROLLBACK') } catch {}
    console.error('Routing POST error:', error)
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  } finally {
    client.release()
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
    await pool.query(`DELETE FROM "RoutingOperation" WHERE "routingId" = $1`, [id])
    await pool.query(`DELETE FROM "Routing" WHERE id = $1 AND "organizationId" = $2`, [id, session.organizationId])
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
  }
}