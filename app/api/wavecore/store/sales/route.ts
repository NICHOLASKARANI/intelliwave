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

    // Create sale record
    const saleResult = await pool.query(
      `INSERT INTO "SalesOrder" (id, number, total, "customerName", status, "organizationId", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, 'COMPLETED', $5, NOW(), NOW()) RETURNING *`,
      [saleId, saleNumber, total, customerName || 'Walk-in Customer', session.organizationId]
    )

    // Create sale items and update stock
    for (const item of items) {
      // Record sale item
      await pool.query(
        `INSERT INTO "SalesOrderItem" (id, "salesOrderId", "productId", quantity, "unitPrice", total, "organizationId")
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [crypto.randomUUID(), saleId, item.id, item.quantity, item.price, item.price * item.quantity, session.organizationId]
      ).catch(() => {})

      // Deduct stock
      await pool.query(
        `UPDATE "StockQuantity" SET quantity = quantity - $1, "availableQty" = "availableQty" - $1, "updatedAt" = NOW() 
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
      `SELECT * FROM "SalesOrder" WHERE "organizationId" = $1 ORDER BY "createdAt" DESC LIMIT 100`,
      [session.organizationId]
    )

    return NextResponse.json({ sales: result.rows })
  } catch (error) {
    return NextResponse.json({ sales: [] })
  }
}