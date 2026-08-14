export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

const invoiceSchema = z.object({
  customerId: z.string(),
  date: z.string(),
  dueDate: z.string(),
  items: z.array(z.object({
    description: z.string().min(1),
    quantity: z.number().positive(),
    unitPrice: z.number().min(0),
  })).min(1, 'At least 1 line item required'),
})

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant()
    const orgId = session.organizationId

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const pageSize = Math.min(50, parseInt(searchParams.get('pageSize') || '20'))
    const offset = (page - 1) * pageSize

    let query = `
      SELECT ci.id, ci.number, ci.date, ci."dueDate", ci.status, ci.subtotal, ci."taxAmount", ci.total,
             c.name as customer_name,
             (SELECT COALESCE(SUM(cp.amount), 0) FROM "CustomerPayment" cp WHERE cp."invoiceId" = ci.id) as paid_amount
      FROM "CustomerInvoice" ci
      JOIN "Customer" c ON c.id = ci."customerId"
      WHERE ci."organizationId" = $1
    `
    const params: any[] = [orgId]

    if (status && status !== 'ALL') {
      params.push(status)
      query += ` AND ci.status = $${params.length}`
    }

    query += ` ORDER BY ci."createdAt" DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`
    params.push(pageSize, offset)

    const result = await pool.query(query, params)

    return NextResponse.json({ invoices: result.rows })
  } catch (error) {
    console.error('Invoices GET error:', error)
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
    const taxAmount = subtotal * 0.16 // 16% VAT
    const total = subtotal + taxAmount
    const invoiceNumber = `INV-${Date.now().toString().slice(-8)}`

    await client.query('BEGIN')

    const invoice = await client.query(
      `INSERT INTO "CustomerInvoice" (id, number, date, "dueDate", status, subtotal, "taxAmount", total, "customerId", "organizationId", "createdAt", "updatedAt")
       VALUES (gen_random_uuid()::text, $1, $2, $3, 'DRAFT', $4, $5, $6, $7, $8, NOW(), NOW())
       RETURNING id`,
      [invoiceNumber, new Date(validated.date), new Date(validated.dueDate), subtotal, taxAmount, total, validated.customerId, orgId]
    )

    for (const item of validated.items) {
      await client.query(
        `INSERT INTO "SalesOrderItem" (id, description, quantity, "unitPrice", total, "salesOrderId", "createdAt")
         VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, NOW())`,
        [item.description, item.quantity, item.unitPrice, item.quantity * item.unitPrice, invoice.rows[0].id]
      )
    }

    await client.query('COMMIT')

    return NextResponse.json({
      success: true,
      invoice: { id: invoice.rows[0].id, number: invoiceNumber, total },
    }, { status: 201 })
  } catch (error) {
    await client.query('ROLLBACK')
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed' }, { status: 422 })
    }
    console.error('Invoices POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  } finally {
    client.release()
  }
}