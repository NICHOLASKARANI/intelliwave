export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/wavecore/auth'
import { pool } from '@/lib/wavecore/db'

// GET /api/wavve-si/restaurant/orders
// Query params: status, search, limit (default 50), offset (default 0)
export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const orgId = session.organizationId
    const url = new URL(request.url)
    const status = url.searchParams.get('status') || null
    const search = url.searchParams.get('search') || null
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 200)
    const offset = Math.max(parseInt(url.searchParams.get('offset') || '0'), 0)

    const conditions = ['so."organizationId" = $1']
    const params: any[] = [orgId]

    if (status) {
      params.push(status)
      conditions.push(`so.status = $${params.length}`)
    }

    if (search) {
      params.push(`%${search}%`)
      conditions.push(`(so.number ILIKE $${params.length} OR c.name ILIKE $${params.length})`)
    }

    params.push(limit)
    const limitIdx = params.length
    params.push(offset)
    const offsetIdx = params.length

    const result = await pool.query(
      `SELECT
         so.id, so.number, so.date, so.status,
         so.subtotal, so.taxAmount, so.total,
         so."customerId",
         c.name AS customer_name,
         c.email AS customer_email,
         so."createdAt"
       FROM "SalesOrder" so
       LEFT JOIN "Customer" c ON c.id = so."customerId"
       WHERE ${conditions.join(' AND ')}
       ORDER BY so.date DESC
       LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
      params
    )

    const countResult = await pool.query(
      `SELECT COUNT(*) AS total
       FROM "SalesOrder" so
       LEFT JOIN "Customer" c ON c.id = so."customerId"
       WHERE ${conditions.slice(0, -2).join(' AND ')}`,
      params.slice(0, -2)
    )

    return NextResponse.json({
      orders: result.rows.map(r => ({
        id: r.id,
        number: r.number,
        date: r.date,
        status: r.status,
        subtotal: Number(r.subtotal),
        taxAmount: Number(r.taxAmount),
        total: Number(r.total),
        customer_name: r.customer_name,
        customer_email: r.customer_email,
        createdAt: r.createdAt,
      })),
      total: Number(countResult.rows[0]?.total) || 0,
      limit, offset,
    })
  } catch (err: any) {
    console.error('[wavve-si/restaurant/orders] GET error:', err?.message)
    return NextResponse.json({ error: 'Failed to load orders' }, { status: 500 })
  }
}

// POST /api/wavve-si/restaurant/orders
// Body: { customerId, items: [{ description, quantity, unitPrice }], taxRate? }
export async function POST(request: NextRequest) {
  const client = await pool.connect()
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { customerId, items, taxRate = 0 } = body

    if (!customerId || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'customerId and items required' }, { status: 400 })
    }

    // Verify customer belongs to this org
    const custCheck = await pool.query(
      'SELECT id FROM "Customer" WHERE id = $1 AND "organizationId" = $2',
      [customerId, session.organizationId]
    )
    if (custCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Customer not found in your organization' }, { status: 404 })
    }

    await client.query('BEGIN')

    // Generate order number: ORD-YYYYMMDD-XXXX
    const now = new Date()
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '')
    const randomSuffix = Math.floor(1000 + Math.random() * 9000)
    const number = `ORD-${dateStr}-${randomSuffix}`

    const subtotal = items.reduce((s: number, i: any) => s + (Number(i.quantity) * Number(i.unitPrice)), 0)
    const taxAmount = subtotal * (Number(taxRate) / 100)
    const total = subtotal + taxAmount

    const orderId = 'c' + Math.random().toString(36).slice(2, 24)

    await client.query(
      `INSERT INTO "SalesOrder" (id, number, date, status, subtotal, "taxAmount", total, "customerId", "organizationId", "createdAt", "updatedAt")
       VALUES ($1, $2, NOW(), 'PENDING', $3, $4, $5, $6, $7, NOW(), NOW())`,
      [orderId, number, subtotal, taxAmount, total, customerId, session.organizationId]
    )

    for (const item of items) {
      const itemId = 'c' + Math.random().toString(36).slice(2, 24)
      const lineTotal = Number(item.quantity) * Number(item.unitPrice)
      await client.query(
        `INSERT INTO "SalesOrderItem" (id, description, quantity, "unitPrice", total, "salesOrderId", "createdAt")
         VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
        [itemId, item.description, Number(item.quantity), Number(item.unitPrice), lineTotal, orderId]
      )
    }

    await client.query('COMMIT')

    return NextResponse.json({
      success: true,
      order: { id: orderId, number, subtotal, taxAmount, total, status: 'PENDING' },
    })
  } catch (err: any) {
    await client.query('ROLLBACK').catch(() => {})
    console.error('[wavve-si/restaurant/orders] POST error:', err?.message)
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
  } finally {
    client.release()
  }
}