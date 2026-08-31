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

    // Create or get customer
    let customerId = null
    if (customerName) {
      const customerResult = await pool.query(
        `SELECT id FROM "Customer" WHERE name = $1 AND "organizationId" = $2 LIMIT 1`,
        [customerName, session.organizationId]
      )
      if (customerResult.rows.length > 0) {
        customerId = customerResult.rows[0].id
      } else {
        const newCustomer = await pool.query(
          `INSERT INTO "Customer" (id, name, type, status, "organizationId", "createdAt", "updatedAt")
           VALUES ($1, $2, 'INDIVIDUAL', 'ACTIVE', $3, NOW(), NOW()) RETURNING id`,
          [crypto.randomUUID(), customerName, session.organizationId]
        )
        customerId = newCustomer.rows[0].id
      }
    }

    // Create sale record with correct columns
    const saleResult = await pool.query(
      `INSERT INTO "SalesOrder" (id, number, date, status, subtotal, "taxAmount", total, "customerId", "organizationId", "createdAt", "updatedAt")
       VALUES ($1, $2, NOW(), 'COMPLETED', $3, 0, $4, $5, $6, NOW(), NOW()) RETURNING *`,
      [saleId, saleNumber, total, total, customerId, session.organizationId]
    )

    // Create sale items and update stock
    for (const item of items) {
      await pool.query(
        `INSERT INTO "SalesOrderItem" (id, "salesOrderId", "productId", quantity, "unitPrice", total, "organizationId")
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [crypto.randomUUID(), saleId, item.id, item.quantity, item.price, item.price * item.quantity, session.organizationId]
      ).catch(() => {})

      await pool.query(
        `UPDATE "StockQuantity" SET quantity = GREATEST(quantity - $1, 0), "availableQty" = GREATEST("availableQty" - $1, 0), "updatedAt" = NOW() 
         WHERE "productId" = $2`,
        [item.quantity, item.id]
      ).catch(() => {})
    }

    return NextResponse.json({ 
      sale: saleResult.rows[0], 
      itemCount: items.length,
      total 
    }, { status: 201 })
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
       ORDER BY so."createdAt" DESC LIMIT 100`,
      [session.organizationId]
    )

    return NextResponse.json({ sales: result.rows })
  } catch (error) {
    return NextResponse.json({ sales: [] })
  }
}