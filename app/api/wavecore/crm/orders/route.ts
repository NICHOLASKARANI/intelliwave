export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

const TAX_RATE = 0.16

async function ensureOrderSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS "SalesOrder" (
      "id" TEXT NOT NULL, "number" TEXT NOT NULL, "date" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
      "status" TEXT DEFAULT 'PENDING', "subtotal" DOUBLE PRECISION DEFAULT 0,
      "taxAmount" DOUBLE PRECISION DEFAULT 0, "total" DOUBLE PRECISION DEFAULT 0,
      "customerId" TEXT, "quotationId" TEXT, "organizationId" TEXT NOT NULL,
      "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "SalesOrder_pkey" PRIMARY KEY ("id")
    )
  `)
  await pool.query(`ALTER TABLE "SalesOrder" ADD COLUMN IF NOT EXISTS "quotationId" TEXT`)
  await pool.query(`ALTER TABLE "SalesOrder" ADD COLUMN IF NOT EXISTS "notes" TEXT`)
  await pool.query(`ALTER TABLE "SalesOrder" ADD COLUMN IF NOT EXISTS "deliveryDate" TIMESTAMP(3)`)
}

async function ensureOrderItemSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS "SalesOrderItem" (
      "id" TEXT NOT NULL,
      "description" TEXT NOT NULL,
      "quantity" INTEGER DEFAULT 1,
      "unitPrice" DOUBLE PRECISION DEFAULT 0,
      "total" DOUBLE PRECISION DEFAULT 0,
      "salesOrderId" TEXT NOT NULL,
      "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "SalesOrderItem_pkey" PRIMARY KEY ("id")
    )
  `)
}

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const orgId = session.organizationId

    await ensureOrderSchema()

    const result = await pool.query(
      `SELECT so.*, c.name AS customer_name,
              q.number AS quotation_number,
              (SELECT COUNT(*)::int FROM "SalesOrderItem" soi WHERE soi."salesOrderId" = so.id) AS items_count
       FROM "SalesOrder" so
       LEFT JOIN "Customer" c ON c.id = so."customerId"
       LEFT JOIN "Quotation" q ON q.id = so."quotationId"
       WHERE so."organizationId" = $1
       ORDER BY so."createdAt" DESC
       LIMIT 50`,
      [orgId]
    )

    return NextResponse.json({ orders: result.rows })
  } catch (error: any) {
    console.error('Orders GET error:', (error as Error).message)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const client = await pool.connect()
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const orgId = session.organizationId

    const body = await request.json()
    const { customerId, items, quotationId, notes, deliveryDate, status } = body

    if (!customerId || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Customer and at least one line item required' }, { status: 400 })
    }

    const cleanItems = items
      .map((i: any) => ({
        description: String(i.description || '').trim(),
        quantity: Math.max(1, Math.floor(Number(i.quantity) || 1)),
        unitPrice: Number(i.unitPrice) || 0,
      }))
      .filter((i: any) => i.description.length > 0)

    if (cleanItems.length === 0) {
      return NextResponse.json({ error: 'All line items need a description' }, { status: 400 })
    }

    const subtotal = cleanItems.reduce((sum: number, i: any) => sum + i.quantity * i.unitPrice, 0)
    const taxAmount = subtotal * TAX_RATE
    const total = subtotal + taxAmount
    const number = 'SO-' + Date.now().toString().slice(-8)
    const initialStatus = status && ['PENDING','CONFIRMED'].includes(status) ? status : 'PENDING'

    await ensureOrderSchema()
    await ensureOrderItemSchema()

    await client.query('BEGIN')

    const oRes = await client.query(
      `INSERT INTO "SalesOrder"
         (id, number, status, subtotal, "taxAmount", total, "customerId", "organizationId",
          "quotationId", notes, "deliveryDate", "createdAt", "updatedAt")
       VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
       RETURNING id, number, total`,
      [
        number, initialStatus, subtotal, taxAmount, total, customerId, orgId,
        quotationId || null,
        notes ? String(notes) : null,
        deliveryDate ? new Date(deliveryDate) : null,
      ]
    )

    const salesOrderId = oRes.rows[0].id

    for (const item of cleanItems) {
      const lineTotal = item.quantity * item.unitPrice
      await client.query(
        `INSERT INTO "SalesOrderItem"
           (id, description, quantity, "unitPrice", total, "salesOrderId", "createdAt")
         VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, NOW())`,
        [item.description, item.quantity, item.unitPrice, lineTotal, salesOrderId]
      )
    }

    await client.query('COMMIT')

    return NextResponse.json({
      success: true,
      order: {
        ...oRes.rows[0],
        subtotal, taxAmount, total,
        itemsCount: cleanItems.length,
      },
    }, { status: 201 })
  } catch (error: any) {
    await client.query('ROLLBACK').catch(() => {})
    console.error('Orders POST error:', (error as Error).message)
    return NextResponse.json({ error: (error as Error).message || 'Internal server error' }, { status: 500 })
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

    await pool.query(`DELETE FROM "SalesOrderItem" WHERE "salesOrderId" = $1`, [id]).catch(() => {})
    await pool.query(
      `DELETE FROM "SalesOrder" WHERE id = $1 AND "organizationId" = $2`,
      [id, session.organizationId]
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Delete failed: ' + (error as Error).message }, { status: 500 })
  }
}