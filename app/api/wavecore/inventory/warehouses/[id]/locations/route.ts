export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/wavecore/auth'
import { pool } from '@/lib/wavecore/db'
import { checkCsrf } from '@/lib/wavecore/csrf'

// GET — list all locations inside a warehouse
export async function GET(request: NextRequest, ctx: { params: { id: string } }) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Verify warehouse belongs to this org
    const wh = await pool.query(
      'SELECT id FROM "Warehouse" WHERE id = $1 AND "organizationId" = $2',
      [ctx.params.id, session.organizationId]
    )
    if (wh.rowCount === 0) return NextResponse.json({ error: 'Warehouse not found' }, { status: 404 })

    const r = await pool.query(
      'SELECT id, name, code, "isActive", "createdAt" FROM "StockLocation" WHERE "warehouseId" = $1 ORDER BY "createdAt" ASC',
      [ctx.params.id]
    )
    return NextResponse.json({ locations: r.rows })
  } catch (error) {
    return NextResponse.json({ locations: [], error: 'Failed to load locations' }, { status: 500 })
  }
}

// POST — add a location to a warehouse
// Body: { name, code? }
export async function POST(request: NextRequest, ctx: { params: { id: string } }) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const csrf = checkCsrf(request)
    if (!csrf.allow) return csrf.response!

    const body = await request.json()
    const name = String(body.name || '').trim()
    const code = String(body.code || '').trim()

    if (!name) return NextResponse.json({ error: 'Location name is required' }, { status: 400 })

    // Verify warehouse belongs to this org
    const wh = await pool.query(
      'SELECT id FROM "Warehouse" WHERE id = $1 AND "organizationId" = $2',
      [ctx.params.id, session.organizationId]
    )
    if (wh.rowCount === 0) return NextResponse.json({ error: 'Warehouse not found' }, { status: 404 })

    const crypto = require('crypto')
    const id = crypto.randomUUID()
    const uniqueCode = code || ('LOC-' + crypto.randomUUID().substring(0, 8).toUpperCase())

    const result = await pool.query(
      `INSERT INTO "StockLocation" (id, name, code, "warehouseId", "isActive", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, true, NOW(), NOW())
       RETURNING *`,
      [id, name, uniqueCode, ctx.params.id]
    )

    return NextResponse.json({ location: result.rows[0] }, { status: 201 })
  } catch (error) {
    console.error('[add location]', error)
    return NextResponse.json({ error: 'Failed to add location: ' + (error as Error).message }, { status: 500 })
  }
}

// DELETE — delete a location (only if it has no stock)
export async function DELETE(request: NextRequest, ctx: { params: { id: string } }) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const csrf = checkCsrf(request)
    if (!csrf.allow) return csrf.response!

    const { searchParams } = new URL(request.url)
    const locationId = searchParams.get('locationId')
    if (!locationId) return NextResponse.json({ error: 'locationId required' }, { status: 400 })

    // Verify warehouse belongs to this org
    const wh = await pool.query(
      'SELECT id FROM "Warehouse" WHERE id = $1 AND "organizationId" = $2',
      [ctx.params.id, session.organizationId]
    )
    if (wh.rowCount === 0) return NextResponse.json({ error: 'Warehouse not found' }, { status: 404 })

    // Check stock — block deletion if any quantity > 0
    const stock = await pool.query(
      'SELECT COALESCE(SUM(quantity), 0) AS qty FROM "StockQuantity" WHERE "locationId" = $1',
      [locationId]
    )
    if (Number(stock.rows[0].qty) > 0) {
      return NextResponse.json({ error: 'Cannot delete location with stock. Transfer or remove stock first.' }, { status: 400 })
    }

    await pool.query(
      'DELETE FROM "StockQuantity" WHERE "locationId" = $1',
      [locationId]
    ).catch(() => {})

    await pool.query(
      'DELETE FROM "StockLocation" WHERE id = $1 AND "warehouseId" = $2',
      [locationId, ctx.params.id]
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[delete location]', error)
    return NextResponse.json({ error: 'Failed to delete location' }, { status: 500 })
  }
}