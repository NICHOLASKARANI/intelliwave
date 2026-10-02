export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

const TAX_RATE = 0.16

/**
 * Ensure the runtime Quotation table has the columns the app expects.
 * Uses ALTER TABLE ADD COLUMN IF NOT EXISTS — safe to run on every request,
 * no schema migration needed.
 */
async function ensureQuotationSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS "Quotation" (
      "id" TEXT NOT NULL, "number" TEXT NOT NULL, "date" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
      "status" TEXT DEFAULT 'DRAFT', "subtotal" DOUBLE PRECISION DEFAULT 0,
      "taxAmount" DOUBLE PRECISION DEFAULT 0, "total" DOUBLE PRECISION DEFAULT 0,
      "customerId" TEXT, "organizationId" TEXT NOT NULL,
      "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "Quotation_pkey" PRIMARY KEY ("id")
    )
  `)
  await pool.query(`ALTER TABLE "Quotation" ADD COLUMN IF NOT EXISTS "validUntil" TIMESTAMP(3)`)
  await pool.query(`ALTER TABLE "Quotation" ADD COLUMN IF NOT EXISTS "notes" TEXT`)
}

async function ensureQuotationItemSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS "QuotationItem" (
      "id" TEXT NOT NULL,
      "description" TEXT NOT NULL,
      "quantity" INTEGER DEFAULT 1,
      "unitPrice" DOUBLE PRECISION DEFAULT 0,
      "total" DOUBLE PRECISION DEFAULT 0,
      "quotationId" TEXT NOT NULL,
      "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "QuotationItem_pkey" PRIMARY KEY ("id")
    )
  `)
}

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const orgId = session.organizationId

    await ensureQuotationSchema()

    const result = await pool.query(
      `SELECT q.*, c.name AS customer_name,
              (SELECT COUNT(*)::int FROM "QuotationItem" qi WHERE qi."quotationId" = q.id) AS items_count
       FROM "Quotation" q
       LEFT JOIN "Customer" c ON c.id = q."customerId"
       WHERE q."organizationId" = $1
       ORDER BY q."createdAt" DESC
       LIMIT 50`,
      [orgId]
    )

    return NextResponse.json({ quotations: result.rows })
  } catch (error: any) {
    console.error('Quotations GET error:', (error as Error).message)
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
    const { customerId, items, validUntil, notes, status } = body

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
    const number = 'QT-' + Date.now().toString().slice(-8)
    const initialStatus = status && ['DRAFT','SENT'].includes(status) ? status : 'DRAFT'

    await ensureQuotationSchema()
    await ensureQuotationItemSchema()

    await client.query('BEGIN')

    const qRes = await client.query(
      `INSERT INTO "Quotation"
         (id, number, status, subtotal, "taxAmount", total, "customerId", "organizationId",
          "validUntil", notes, "createdAt", "updatedAt")
       VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
       RETURNING id, number, total`,
      [
        number, initialStatus, subtotal, taxAmount, total, customerId, orgId,
        validUntil ? new Date(validUntil) : null,
        notes ? String(notes) : null,
      ]
    )

    const quotationId = qRes.rows[0].id

    for (const item of cleanItems) {
      const lineTotal = item.quantity * item.unitPrice
      await client.query(
        `INSERT INTO "QuotationItem"
           (id, description, quantity, "unitPrice", total, "quotationId", "createdAt")
         VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, NOW())`,
        [item.description, item.quantity, item.unitPrice, lineTotal, quotationId]
      )
    }

    await client.query('COMMIT')

    return NextResponse.json({
      success: true,
      quotation: {
        ...qRes.rows[0],
        subtotal, taxAmount, total,
        itemsCount: cleanItems.length,
      },
    }, { status: 201 })
  } catch (error: any) {
    await client.query('ROLLBACK').catch(() => {})
    console.error('Quotations POST error:', (error as Error).message)
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

    // Cascade-delete line items first
    await pool.query(`DELETE FROM "QuotationItem" WHERE "quotationId" = $1`, [id]).catch(() => {})
    await pool.query(
      `DELETE FROM "Quotation" WHERE id = $1 AND "organizationId" = $2`,
      [id, session.organizationId]
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Delete failed: ' + (error as Error).message }, { status: 500 })
  }
}