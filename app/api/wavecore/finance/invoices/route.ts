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
    const session = await requireTenant(request)
    const orgId = session.organizationId
    const result = await pool.query(
      'SELECT * FROM "CustomerInvoice" WHERE "organizationId" = $1 ORDER BY "createdAt" DESC LIMIT 50',
      [orgId]
    )
    return NextResponse.json({ invoices: result.rows })
  } catch (error: any) {
    console.error('Invoices GET error:', error.message)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const client = await pool.connect()
  try {
    const session = await requireTenant(request)
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

    const subtotal = validated.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
    const taxAmount = subtotal * 0.16
    const total = subtotal + taxAmount
    const invoiceNumber = 'INV-' + Date.now().toString().slice(-8)

    const result = await client.query(
      `INSERT INTO "CustomerInvoice" (id, number, date, "dueDate", status, subtotal, "taxAmount", total, "customerId", "organizationId", "createdAt", "updatedAt")
       VALUES (gen_random_uuid()::text, $1, $2, $3, 'DRAFT', $4, $5, $6, $7, $8, NOW(), NOW())
       RETURNING id, number, total`,
      [invoiceNumber, new Date(validated.date), new Date(validated.dueDate || validated.date), subtotal, taxAmount, total, validated.customerId, orgId]
    )

    return NextResponse.json({
      success: true,
      invoice: result.rows[0],
    }, { status: 201 })
  } catch (error: any) {
    console.error('Invoices POST error:', error.message)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  } finally {
    client.release()
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const result = await pool.query(
      `UPDATE "CustomerInvoice" SET status = $1, "updatedAt" = NOW()
       WHERE id = $2 AND "organizationId" = $3
       RETURNING *`,
      [body.status, body.id, session.organizationId]
    )
    return NextResponse.json({ invoice: result.rows[0] })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update invoice' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    await pool.query(`DELETE FROM "CustomerInvoice" WHERE id = $1 AND "organizationId" = $2`, [id, session.organizationId])
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete invoice' }, { status: 500 })
  }
}