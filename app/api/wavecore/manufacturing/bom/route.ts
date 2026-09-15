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
    const productId = searchParams.get('productId')
    const active = searchParams.get('active')

    let sql = `
      SELECT b.*,
             p.name AS "productName",
             p.sku AS "productSku",
             COALESCE(c.cnt, 0) AS "componentCount",
             COALESCE(c.cost, 0) AS "totalCost"
      FROM "BillOfMaterial" b
      LEFT JOIN "Product" p ON p.id = b."productId"
      LEFT JOIN (
        SELECT bc."bomId",
               COUNT(*) AS cnt,
               SUM(bc.quantity * COALESCE(comp."costPrice", 0)) AS cost
        FROM "BOMComponent" bc
        LEFT JOIN "Product" comp ON comp.id = bc."productId"
        GROUP BY bc."bomId"
      ) c ON c."bomId" = b.id
      WHERE b."organizationId" = $1
    `
    const params: any[] = [session.organizationId]
    let idx = 2

    if (search) {
      sql += ` AND (b.name ILIKE $${idx} OR b.code ILIKE $${idx} OR p.name ILIKE $${idx})`
      params.push(`%${search}%`); idx++
    }
    if (productId && productId !== 'ALL') {
      sql += ` AND b."productId" = $${idx++}`
      params.push(productId)
    }
    if (active === 'true') sql += ` AND b."isActive" = TRUE`
    if (active === 'false') sql += ` AND b."isActive" = FALSE`

    sql += ` ORDER BY b."createdAt" DESC`

    const result = await pool.query(sql, params)
    const boms = result.rows

    const summary = {
      total: boms.length,
      active: boms.filter(b => b.isActive).length,
      inactive: boms.filter(b => !b.isActive).length,
      withComponents: boms.filter(b => Number(b.componentCount) > 0).length,
      totalComponents: boms.reduce((s, b) => s + Number(b.componentCount || 0), 0),
      avgComponents: boms.length > 0 ? Math.round(boms.reduce((s, b) => s + Number(b.componentCount || 0), 0) / boms.length) : 0,
      avgCost: boms.length > 0 ? Math.round(boms.reduce((s, b) => s + Number(b.totalCost || 0), 0) / boms.length) : 0,
      totalValue: Math.round(boms.reduce((s, b) => s + Number(b.totalCost || 0), 0)),
    }

    return NextResponse.json({ boms, summary })
  } catch (error) {
    console.error('BOM GET error:', error)
    return NextResponse.json({ boms: [], summary: {} })
  }
}

export async function POST(request: NextRequest) {
  const client = await pool.connect()
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    if (!body.name || !body.name.trim()) return NextResponse.json({ error: 'BOM name is required' }, { status: 400 })
    if (!body.productId) return NextResponse.json({ error: 'Product is required' }, { status: 400 })
    if (!Array.isArray(body.components) || body.components.length === 0) {
      return NextResponse.json({ error: 'At least one component is required' }, { status: 400 })
    }
    for (const c of body.components) {
      if (!c.productId) return NextResponse.json({ error: 'Every component needs a product' }, { status: 400 })
      if (!c.quantity || Number(c.quantity) <= 0) return NextResponse.json({ error: 'Component quantity must be > 0' }, { status: 400 })
    }

    const crypto = require('crypto')
    const bomId = crypto.randomUUID()
    const code = body.code || ('BOM-' + new Date().getFullYear() + '-' + Math.floor(100000 + Math.random() * 900000))

    await client.query('BEGIN')

    const bomResult = await client.query(
      `INSERT INTO "BillOfMaterial"
        (id, name, code, "productId", quantity, "isActive", "organizationId", "createdAt", "updatedAt")
       VALUES ($1,$2,$3,$4,$5,$6,$7,NOW(),NOW())
       RETURNING *`,
      [bomId, body.name.trim(), code, body.productId, Number(body.quantity || 1), body.isActive !== false, session.organizationId]
    )

    for (const c of body.components) {
      await client.query(
        `INSERT INTO "BOMComponent"
          (id, "bomId", "productId", quantity, unit, "scrapRate", operation, "createdAt")
         VALUES ($1,$2,$3,$4,$5,$6,$7,NOW())`,
        [
          crypto.randomUUID(),
          bomId,
          c.productId,
          Number(c.quantity),
          c.unit || 'pcs',
          Number(c.scrapRate || 0),
          c.operation || null,
        ]
      )
    }

    await client.query('COMMIT')
    return NextResponse.json({ bom: bomResult.rows[0] }, { status: 201 })
  } catch (error) {
    try { await client.query('ROLLBACK') } catch {}
    console.error('BOM POST error:', error)
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

    await pool.query(`DELETE FROM "BOMComponent" WHERE "bomId" = $1`, [id])
    await pool.query(`DELETE FROM "BillOfMaterial" WHERE id = $1 AND "organizationId" = $2`, [id, session.organizationId])
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
  }
}