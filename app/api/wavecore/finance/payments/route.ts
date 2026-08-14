export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

const paymentSchema = z.object({
  invoiceId: z.string(),
  amount: z.number().positive(),
  date: z.string(),
  method: z.string().default('MPESA'),
  reference: z.string().optional().nullable(),
})

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant()
    const orgId = session.organizationId

    const result = await pool.query(
      `SELECT cp.id, cp.number, cp.date, cp.amount, cp.method, cp.reference,
              ci.number as invoice_number, c.name as customer_name
       FROM "CustomerPayment" cp
       JOIN "CustomerInvoice" ci ON ci.id = cp."invoiceId"
       JOIN "Customer" c ON c.id = cp."customerId"
       WHERE cp."organizationId" = $1
       ORDER BY cp."createdAt" DESC
       LIMIT 50`,
      [orgId]
    )

    return NextResponse.json({ payments: result.rows })
  } catch (error) {
    console.error('Payments GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const client = await pool.connect()
  try {
    const session = await requireTenant()
    const orgId = session.organizationId

    const body = await request.json()
    const validated = paymentSchema.parse(body)

    // Verify invoice belongs to tenant
    const invoice = await client.query(
      'SELECT id, total, status, "customerId" FROM "CustomerInvoice" WHERE id = $1 AND "organizationId" = $2',
      [validated.invoiceId, orgId]
    )
    if (invoice.rows.length === 0) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    // Check if payment exceeds invoice balance
    const paidResult = await client.query(
      'SELECT COALESCE(SUM(amount), 0) as paid FROM "CustomerPayment" WHERE "invoiceId" = $1',
      [validated.invoiceId]
    )
    const alreadyPaid = paidResult.rows[0].paid || 0
    const balance = invoice.rows[0].total - alreadyPaid

    if (validated.amount > balance + 0.01) {
      return NextResponse.json({ error: 'Payment amount exceeds invoice balance' }, { status: 422 })
    }

    await client.query('BEGIN')

    const paymentNumber = `PAY-${Date.now().toString().slice(-8)}`
    const payment = await client.query(
      `INSERT INTO "CustomerPayment" (id, number, date, amount, method, reference, "invoiceId", "customerId", "organizationId", "createdAt")
       VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, $6, $7, $8, NOW())
       RETURNING id`,
      [paymentNumber, new Date(validated.date), validated.amount, validated.method, validated.reference || null, validated.invoiceId, invoice.rows[0].customerId, orgId]
    )

    // Update invoice status
    const newPaid = alreadyPaid + validated.amount
    let newStatus = 'PARTIALLY_PAID'
    if (newPaid >= invoice.rows[0].total - 0.01) {
      newStatus = 'PAID'
    }

    await client.query(
      'UPDATE "CustomerInvoice" SET status = $1, "updatedAt" = NOW() WHERE id = $2',
      [newStatus, validated.invoiceId]
    )

    await client.query('COMMIT')

    return NextResponse.json({ success: true, paymentId: payment.rows[0].id, newStatus }, { status: 201 })
  } catch (error) {
    await client.query('ROLLBACK')
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed' }, { status: 422 })
    }
    console.error('Payments POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  } finally {
    client.release()
  }
}