export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const bomRes = await pool.query(
      `SELECT b.* FROM "BillOfMaterial" b
       WHERE b.id = $1 AND b."organizationId" = $2`,
      [params.id, session.organizationId]
    )
    if (bomRes.rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const compRes = await pool.query(
      `SELECT bc.*,
              bc."productId" AS "componentName",
              NULL::text AS "componentSku",
              0::float AS "unitCost",
              0::float AS "extendedCost"
       FROM "BOMComponent" bc
       WHERE bc."bomId" = $1
       ORDER BY bc."createdAt" ASC`,
      [params.id]
    )

    return NextResponse.json({ bom: bomRes.rows[0], components: compRes.rows, totalCost: 0 })
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
      `SELECT id FROM "BillOfMaterial" WHERE id = $1 AND "organizationId" = $2`,
      [params.id, session.organizationId]
    )
    if (own.rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const body = await request.json()

    await client.query('BEGIN')

    const sets: string[] = []
    const values: any[] = []
    let i = 1
    if (body.name !== undefined) { sets.push(`"name" = $${i++}`); values.push(body.name) }
    if (body.code !== undefined) { sets.push(`"code" = $${i++}`); values.push(body.code) }
    if (body.productName !== undefined) { sets.push(`"productId" = $${i++}`); values.push(body.productName) }
    if (body.quantity !== undefined) { sets.push(`"quantity" = $${i++}`); values.push(Number(body.quantity)) }
    if (body.isActive !== undefined) { sets.push(`"isActive" = $${i++}`); values.push(body.isActive) }
    if (sets.length > 0) {
      sets.push(`"updatedAt" = NOW()`)
      values.push(params.id)
      await client.query(`UPDATE "BillOfMaterial" SET ${sets.join(', ')} WHERE id = $${i}`, values)
    }

    if (Array.isArray(body.components)) {
      await client.query(`DELETE FROM "BOMComponent" WHERE "bomId" = $1`, [params.id])
      const crypto = require('crypto')
      for (const c of body.components) {
        if (!c.productName || !c.quantity) continue
        await client.query(
          `INSERT INTO "BOMComponent"
            (id, "bomId", "productId", quantity, unit, "scrapRate", operation, "createdAt")
           VALUES ($1,$2,$3,$4,$5,$6,$7,NOW())`,
          [crypto.randomUUID(), params.id, c.productName, Number(c.quantity), c.unit || 'pcs', Number(c.scrapRate || 0), c.operation || null]
        )
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

    await pool.query(`DELETE FROM "BOMComponent" WHERE "bomId" = $1`, [params.id])
    const result = await pool.query(
      `DELETE FROM "BillOfMaterial" WHERE id = $1 AND "organizationId" = $2`,
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
      `SELECT * FROM "BillOfMaterial" WHERE id = $1 AND "organizationId" = $2`,
      [params.id, session.organizationId]
    )
    if (src.rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const crypto = require('crypto')
    const newId = crypto.randomUUID()
    const s = src.rows[0]
    const newCode = (s.code || 'BOM') + '-COPY-' + Math.floor(1000 + Math.random() * 9000)

    await client.query('BEGIN')
    await client.query(
      `INSERT INTO "BillOfMaterial"
        (id, name, code, "productId", quantity, "isActive", "organizationId", "createdAt", "updatedAt")
       VALUES ($1,$2,$3,$4,$5,$6,$7,NOW(),NOW())`,
      [newId, s.name + ' (Copy)', newCode, s.productId, s.quantity, s.isActive, session.organizationId]
    )

    const comps = await client.query(`SELECT * FROM "BOMComponent" WHERE "bomId" = $1`, [params.id])
    for (const c of comps.rows) {
      await client.query(
        `INSERT INTO "BOMComponent"
          (id, "bomId", "productId", quantity, unit, "scrapRate", operation, "createdAt")
         VALUES ($1,$2,$3,$4,$5,$6,$7,NOW())`,
        [crypto.randomUUID(), newId, c.productId, c.quantity, c.unit, c.scrapRate, c.operation]
      )
    }

    await client.query('COMMIT')
    return NextResponse.json({ bom: { id: newId } }, { status: 201 })
  } catch (error) {
    try { await client.query('ROLLBACK') } catch {}
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  } finally {
    client.release()
  }
}