export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/wavecore/auth'
import { pool } from '@/lib/wavecore/db'

export async function POST(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { items, total, customerName } = body
    const crypto = require('crypto')
    const saleId = crypto.randomUUID()
    const saleNumber = 'SALE-' + Date.now().toString().slice(-8)

    // Always create a customer (Walk-in if no name)
    const finalCustomerName = customerName?.trim() || 'Walk-in Customer'
    let customerId = null

    const customerResult = await pool.query(
      `SELECT id FROM "Customer" WHERE name = $1 AND "organizationId" = $2 LIMIT 1`,
      [finalCustomerName, session.organizationId]
    )

    if (customerResult.rows.length > 0) {
      customerId = customerResult.rows[0].id
    } else {
      const newCustomer = await pool.query(
        `INSERT INTO "Customer" (id, name, type, status, "organizationId", "createdAt", "updatedAt")
         VALUES ($1, $2, 'INDIVIDUAL', 'ACTIVE', $3, NOW(), NOW()) RETURNING id`,
        [crypto.randomUUID(), finalCustomerName, session.organizationId]
      )
      customerId = newCustomer.rows[0].id
    }

    // Create sale
    const saleResult = await pool.query(
      `INSERT INTO "SalesOrder" (id, number, date, status, subtotal, "taxAmount", total, "customerId", "organizationId", "createdAt", "updatedAt")
       VALUES ($1, $2, NOW(), 'DELIVERED', $3, 0, $4, $5, $6, NOW(), NOW()) RETURNING *`,
      [saleId, saleNumber, total, total, customerId, session.organizationId]
    )

    // Create items + deduct stock
    for (const item of items) {
      // Resolve product name for the description field. SalesOrderItem.description
      // is NOT NULL, so we must always supply a value.
      let description = item.description || item.name || null
      if (!description && item.id) {
        const p = await pool.query(
          `SELECT name FROM "Product" WHERE id = $1 AND "organizationId" = $2`,
          [item.id, session.organizationId]
        ).catch(() => ({ rows: [] as any[] }))
        description = p.rows[0]?.name || 'Item'
      }
      if (!description) description = 'Item'

      try {
        await pool.query(
          `INSERT INTO "SalesOrderItem" (id, "salesOrderId", "productId", description, quantity, "unitPrice", total, "organizationId")
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [crypto.randomUUID(), saleId, item.id, description, item.quantity, item.price, item.price * item.quantity, session.organizationId]
        )
      } catch (e) {
        console.error('[store sales] item insert failed:', (e as Error).message)
      }

      await pool.query(
        `UPDATE "StockQuantity" SET quantity = GREATEST(quantity - $1, 0), "availableQty" = GREATEST("availableQty" - $1, 0), "updatedAt" = NOW() WHERE "productId" = $2`,
        [item.quantity, item.id]
      ).catch((e) => { console.warn('[store sales] stock deduct failed:', (e as Error).message) })
    }

    return NextResponse.json({ sale: saleResult.rows[0], itemCount: items.length, total }, { status: 201 })
  } catch (error) {
    console.error('Sale create error:', error)
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const result = await pool.query(
      `SELECT so.*, c.name as "customerName"
       FROM "SalesOrder" so
       LEFT JOIN "Customer" c ON so."customerId" = c.id
       WHERE so."organizationId" = $1
       ORDER BY so."createdAt" DESC LIMIT 500`,
      [session.organizationId]
    )

    return NextResponse.json({ sales: result.rows })
  } catch (error) {
    return NextResponse.json({ sales: [] })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    await pool.query(`DELETE FROM "SalesOrderItem" WHERE "salesOrderId" = $1`, [id]).catch(() => {})
    await pool.query(`DELETE FROM "SalesOrder" WHERE id = $1 AND "organizationId" = $2`, [id, session.organizationId])

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
  }
}