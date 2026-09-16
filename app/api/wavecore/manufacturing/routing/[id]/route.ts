export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const r = await pool.query(
      `SELECT * FROM "Routing" WHERE id = $1 AND "organizationId" = $2`,
      [params.id, session.organizationId]
    )
    if (r.rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const ops = await pool.query(
      `SELECT * FROM "RoutingOperation" WHERE "routingId" = $1 ORDER BY sequence ASC`,
      [params.id]
    )

    const totalDuration = ops.rows.reduce((s, o) => s + Number(o.durationMinutes || 0), 0)
    const totalSetup = ops.rows.reduce((s, o) => s + Number(o.setupMinutes || 0), 0)

    return NextResponse.json({
      routing: r.rows[0],
      operations: ops.rows,
      totals: { duration: totalDuration, setup: totalSetup, total: totalDuration + totalSetup },
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const client = await pool.connect()
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const own = await client.query(
      `SELECT id FROM "Routing" WHERE id = $1 AND "organizationId" = $2`,
      [params.id, session.organizationId]
    )
    if (own.rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const body = await request.json()

    await client.query('BEGIN')

    const sets: string[] = []
    const values: any[] = []
    let i = 1
    for (const key of ['name', 'code', 'productId']) {
      if (body[key] !== undefined) { sets.push(`"${key}" = $${i++}`); values.push(body[key]) }
    }
    if (sets.length > 0) {
      sets.push(`"updatedAt" = NOW()`)
      values.push(params.id)
      await client.query(`UPDATE "Routing" SET ${sets.join(', ')} WHERE id = $${i}`, values)
    }

    if (Array.isArray(body.operations)) {
      await client.query(`DELETE FROM "RoutingOperation" WHERE "routingId" = $1`, [params.id])
      const crypto = require('crypto')
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
            params.id,
            op.workCenterId || null,
          ]
        )
        seq++
      }
    }

    await client.query('COMMIT')
    return NextResponse.json({ success: true })
  } catch (error) {
    try { await client.query('ROLLBACK') } catch {}
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  } finally {
    client.release()
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    await pool.query(`DELETE FROM "RoutingOperation" WHERE "routingId" = $1`, [params.id])
    const result = await pool.query(
      `DELETE FROM "Routing" WHERE id = $1 AND "organizationId" = $2`,
      [params.id, session.organizationId]
    )
    if (result.rowCount === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const client = await pool.connect()
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const src = await client.query(
      `SELECT * FROM "Routing" WHERE id = $1 AND "organizationId" = $2`,
      [params.id, session.organizationId]
    )
    if (src.rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const s = src.rows[0]
    const crypto = require('crypto')
    const newId = crypto.randomUUID()
    const newCode = (s.code || 'RT') + '-COPY-' + Math.floor(1000 + Math.random() * 9000)

    await client.query('BEGIN')
    await client.query(
      `INSERT INTO "Routing" (id, name, code, "productId", "organizationId", "createdAt", "updatedAt")
       VALUES ($1,$2,$3,$4,$5,NOW(),NOW())`,
      [newId, s.name + ' (Copy)', newCode, s.productId, session.organizationId]
    )

    const ops = await client.query(`SELECT * FROM "RoutingOperation" WHERE "routingId" = $1`, [params.id])
    for (const op of ops.rows) {
      await client.query(
        `INSERT INTO "RoutingOperation"
          (id, sequence, name, description, "durationMinutes", "setupMinutes", "routingId", "workCenterId", "createdAt")
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NOW())`,
        [
          crypto.randomUUID(),
          op.sequence,
          op.name,
          op.description,
          op.durationMinutes,
          op.setupMinutes,
          newId,
          op.workCenterId,
        ]
      )
    }

    await client.query('COMMIT')
    return NextResponse.json({ routing: { id: newId } }, { status: 201 })
  } catch (error) {
    try { await client.query('ROLLBACK') } catch {}
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  } finally {
    client.release()
  }
}