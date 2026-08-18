export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

const purchaseOrderSchema = z.object({
  supplierName: z.string().min(1),
  notes: z.string().optional(),
  items: z.array(z.object({
    description: z.string().min(1),
    quantity: z.number().positive(),
    unitPrice: z.number().min(0),
  })).min(1),
})

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session || !session.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const result = await pool.query(
      `SELECT po.id, po.number, po.date, po.status, po.subtotal, po."taxAmount", po.total, po."supplierName", po.notes
       FROM "PurchaseOrder" po
       WHERE po."organizationId" = $1
       ORDER BY po."createdAt" DESC
       LIMIT 50`,
      [session.organizationId]
    )

    return NextResponse.json({ purchaseOrders: result.rows })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch purchase orders: ' + error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session || !session.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validated = purchaseOrderSchema.parse(body)

    const poNumber = 'PO-' + Date.now()

    // Calculate totals
    let subtotal = 0
    for (const item of validated.items) {
      subtotal += item.quantity * item.unitPrice
    }
    const taxAmount = subtotal * 0.16 // 16% VAT
    const total = subtotal + taxAmount

    // Insert PO with gen_random_uuid() for id
    const result = await pool.query(
      `INSERT INTO "PurchaseOrder" (id, "organizationId", number, date, status, "supplierName", notes, subtotal, "taxAmount", total, "createdAt", "updatedAt")
       VALUES (gen_random_uuid()::text, $1, $2, NOW(), 'DRAFT', $3, $4, $5, $6, $7, NOW(), NOW())
       RETURNING *`,
      [session.organizationId, poNumber, validated.supplierName, validated.notes || null, subtotal, taxAmount, total]
    )

    const po = result.rows[0]

    // Insert PO items
    for (const item of validated.items) {
      const itemTotal = item.quantity * item.unitPrice
      await pool.query(
        `INSERT INTO "PurchaseOrderItem" (id, description, quantity, "unitPrice", total, "purchaseOrderId", "createdAt")
         VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, NOW())`,
        [item.description, item.quantity, item.unitPrice, itemTotal, po.id]
      )
    }

    return NextResponse.json({ purchaseOrder: po }, { status: 201 })
  } catch (error) {
    console.error('PO create error:', error)
    return NextResponse.json({ error: 'Failed to create purchase order: ' + error.message }, { status: 500 })
  }
}