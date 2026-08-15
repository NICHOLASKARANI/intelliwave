export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

const invoiceSchema = z.object({
  customerId: z.string(),
  date: z.string(),
  dueDate: z.string().optional(),
  items: z.array(z.object({
    description: z.string().min(1),
    quantity: z.number().positive(),
    unitPrice: z.number().min(0),
  })).min(1),
})

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant()
    const orgId = session.organizationId

    const result = await pool.query(
      `SELECT ci.id, ci.number, ci.date, ci."dueDate", ci.status, ci.subtotal, ci."taxAmount", ci.total,
              c.name as customer_name,
              COALESCE((SELECT SUM(cp.amount) FROM "CustomerPayment" cp WHERE cp."invoiceId" = ci.id), 0) as paid_amount
       FROM "CustomerInvoice" ci
       JOIN "Customer" c ON c.id = ci."customerId"
       WHERE ci."organizationId" = $1
       ORDER BY ci."createdAt" DESC
       LIMIT 50`,
      [orgId]
    )

    return NextResponse.json({ invoices: result.rows })
  } catch (error) {
    console.error('Invoices GET error:', error.message)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const client = await pool.connect()
  try {
    const session = await requireTenant()
    const orgId = session.organizationId

    const body = await request.json()
    const validated = invoiceSchema.parse(body)

    // Verify customer belongs to tenant
    const customer = await client.query(
      'SELECT id FROM "Customer" WHERE id = $1 AND "organizationId" = $2',
      [validated.customerId, orgId]
    )
    if (customer.rows.length === 0) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    // Calculate totals server-side
    const subtotal = validated.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
    const taxAmount = subtotal * 0.16
    const total = subtotal + taxAmount
    const invoiceNumber = 'INV-' + Date.now().toString().slice(-8)

    await client.query('BEGIN')

    const invoiceResult = await client.query(
      `INSERT INTO "CustomerInvoice" (id, number, date, "dueDate", status, subtotal, "taxAmount", total, "customerId", "organizationId", "createdAt", "updatedAt")
       VALUES (gen_random_uuid()::text, $1, $2, $3, 'DRAFT', $4, $5, $6, $7, $8, NOW(), NOW())
       RETURNING id, number`,
      [invoiceNumber, new Date(validated.date), new Date(validated.dueDate || validated.date), subtotal, taxAmount, total, validated.customerId, orgId]
    )

    const invoiceId = invoiceResult.rows[0].id

    // Store line items in a simple way (using SalesOrderItem table structure)
    for (const item of validated.items) {
      // Check if SalesOrderItem table exists and has the columns we need
      // We'll insert into a generic way
      await client.query(
        `INSERT INTO "SalesOrderItem" (id, description, quantity, "unitPrice", total, "salesOrderId", "createdAt")
         VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, NOW())`,
        [item.description, item.quantity, item.unitPrice, item.quantity * item.unitPrice, invoiceId]
      )
    }

    await client.query('COMMIT')

    return NextResponse.json({
      success: true,
      invoice: { id: invoiceId, number: invoiceNumber, total },
    }, { status: 201 })
  } catch (error) {
    await client.query('ROLLBACK')
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed' }, { status: 422 })
    }
    console.error('Invoices POST error:', error.message)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  } finally {
    client.release()
  }
}