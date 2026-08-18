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

    const result = await pool.query(
      `SELECT po.id, po.number, po.date, po.status, po.subtotal, po.taxAmount, po.total, po."supplierName", po.notes,
              (SELECT json_agg(json_build_object('id', poi.id, 'description', poi.description, 'quantity', poi.quantity, 'unitPrice', poi."unitPrice", 'total', poi.total))
               FROM "PurchaseOrderItem" poi WHERE poi."purchaseOrderId" = po.id) as items
       FROM "PurchaseOrder" po
       WHERE po."organizationId" = $1
       ORDER BY po."createdAt" DESC
       LIMIT 50`,
      [session.organizationId]
    )

    return NextResponse.json({ purchaseOrders: result.rows })
  } catch (error) {
    console.error('PO GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const client = await pool.connect()
  try {
    const session = await requireTenant(request)

    const body = await request.json()
    const validated = purchaseOrderSchema.parse(body)

    const subtotal = validated.items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0)
    const taxAmount = subtotal * 0.16 // 16% VAT
    const total = subtotal + taxAmount
    const poNumber = `PO-${Date.now().toString().slice(-6)}`

    await client.query('BEGIN')

    const po = await client.query(
      `INSERT INTO "PurchaseOrder" (id, number, status, subtotal, "taxAmount", total, "supplierName", notes, "organizationId", "createdAt", "updatedAt")
       VALUES (gen_random_uuid()::text, $1, 'DRAFT', $2, $3, $4, $5, $6, $7, NOW(), NOW())
       RETURNING id`,
      [poNumber, subtotal, taxAmount, total, validated.supplierName, validated.notes || null, session.organizationId]
    )

    for (const item of validated.items) {
      await client.query(
        `INSERT INTO "PurchaseOrderItem" (id, description, quantity, "unitPrice", total, "purchaseOrderId", "createdAt")
         VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, NOW())`,
        [item.description, item.quantity, item.unitPrice, item.quantity * item.unitPrice, po.rows[0].id]
      )
    }

    await client.query('COMMIT')

    return NextResponse.json({
      success: true,
      purchaseOrder: { id: po.rows[0].id, number: poNumber, total },
    }, { status: 201 })
  } catch (error) {
    await client.query('ROLLBACK')
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed' }, { status: 422 })
    }
    console.error('PO POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  } finally {
    client.release()
  }
}