export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/wavecore/auth'
import { pool } from '@/lib/wavecore/db'

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const orgId = session.organizationId

    const transfers = await pool.query(`
      SELECT t.*, p.sku
      FROM "Transfer" t
      LEFT JOIN "Product" p ON p.id = t."productId"
      WHERE t."organizationId" = $1
      ORDER BY t."createdAt" DESC LIMIT 100
    `, [orgId]).catch(() => ({ rows: [] }))

    const summary = {
      totalTransfers: transfers.rows.length,
      pending: transfers.rows.filter(t => t.status === 'PENDING').length,
      inTransit: transfers.rows.filter(t => t.status === 'IN_TRANSIT').length,
      completed: transfers.rows.filter(t => t.status === 'COMPLETED').length
    }

    return NextResponse.json({ transfers: transfers.rows, summary })
  } catch (error) {
    return NextResponse.json({ transfers: [], summary: { totalTransfers: 0, pending: 0, inTransit: 0, completed: 0 } })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const crypto = require('crypto')
    const id = crypto.randomUUID()
    const number = 'TRN-' + Date.now().toString().slice(-8)

    const productResult = await pool.query(
      'SELECT name FROM "Product" WHERE id = $1 AND "organizationId" = $2',
      [body.productId, session.organizationId]
    )

    if (productResult.rows.length === 0) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // User-typed locations
    const fromLocation = body.fromLocation || ''
    const toLocation = body.toLocation || ''

    // Save transfer with details in notes
    const notes = JSON.stringify({
      buyingPrice: Number(body.buyingPrice || 0),
      sellingPrice: Number(body.sellingPrice || 0)
    })

    const result = await pool.query(`
      INSERT INTO "Transfer" (id, number, "productId", "productName", "fromLocation", "toLocation", quantity, status, notes, "organizationId", "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'PENDING', $8, $9, NOW(), NOW()) RETURNING *
    `, [id, number, body.productId, productResult.rows[0].name, fromLocation, toLocation, Number(body.quantity || 0), notes, session.organizationId])

    return NextResponse.json({ transfer: result.rows[0], message: 'Transfer created' }, { status: 201 })
  } catch (error) {
    console.error('Transfers POST error:', error)
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

    await pool.query('DELETE FROM "Transfer" WHERE id = $1 AND "organizationId" = $2', [id, session.organizationId])
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
  }
}