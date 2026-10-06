export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

const round2 = (n: number) => Math.round((Number(n) + Number.EPSILON) * 100) / 100

/**
 * POST /api/wavecore/crm/orders/[id]/convert-to-invoice
 *
 * Creates a CustomerInvoice from a Sales Order. Idempotent: if an
 * invoice already exists with salesOrderId = this order, the
 * existing one is returned instead of creating a duplicate.
 *
 * The invoice is DRAFT by default so finance can review before
 * sending. The CustomerInvoice has no separate items table in this
 * schema — subtotal / tax / total are copied straight from the
 * order, and the line detail stays on the SalesOrder for reference.
 *
 * Refuses if the order is CANCELLED.
 * Runs in a transaction.
 * Tenant-scoped.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const client = await pool.connect()
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const orgId = session.organizationId

    const orderRes = await client.query(
      `SELECT id, number, status, subtotal, "taxAmount", total, "customerId"
       FROM "SalesOrder"
       WHERE id = $1 AND "organizationId" = $2`,
      [params.id, orgId]
    )
    if (orderRes.rowCount === 0) {
      return NextResponse.json({ error: 'Sales order not found' }, { status: 404 })
    }
    const order = orderRes.rows[0]

    if (order.status === 'CANCELLED') {
      return NextResponse.json({ error: 'Cannot invoice a cancelled order' }, { status: 409 })
    }

    // Idempotency — if an invoice already exists for this order, return it
    const existing = await client.query(
      `SELECT id, number, date, "dueDate", status, subtotal, "taxAmount", total
       FROM "CustomerInvoice"
       WHERE "salesOrderId" = $1 AND "organizationId" = $2
       ORDER BY "createdAt" DESC LIMIT 1`,
      [params.id, orgId]
    )
    if (existing.rowCount > 0) {
      return NextResponse.json({
        invoice: existing.rows[0],
        alreadyExisted: true,
        message: 'An invoice already exists for this sales order.',
      })
    }

    const crypto = require('crypto')
    const id = crypto.randomUUID()
    const invoiceNumber = 'INV-' + Date.now().toString().slice(-8)

    const today = new Date()
    const dueDate = new Date(today.getTime() + 30 * 86400_000)

    await client.query('BEGIN')

    await client.query(
      `INSERT INTO "CustomerInvoice"
         (id, number, date, "dueDate", status, subtotal, "taxAmount", total,
          "customerId", "salesOrderId", "organizationId", "createdAt", "updatedAt")
       VALUES ($1,$2,$3,$4,'DRAFT',$5,$6,$7,$8,$9,$10,NOW(),NOW())`,
      [
        id,
        invoiceNumber,
        today.toISOString().slice(0, 10),
        dueDate.toISOString().slice(0, 10),
        round2(Number(order.subtotal || 0)),
        round2(Number(order.taxAmount || 0)),
        round2(Number(order.total || 0)),
        order.customerId,
        order.id,
        orgId,
      ]
    )

    await client.query('COMMIT')

    return NextResponse.json({
      invoice: {
        id,
        number: invoiceNumber,
        date: today.toISOString().slice(0, 10),
        dueDate: dueDate.toISOString().slice(0, 10),
        status: 'DRAFT',
        subtotal: round2(Number(order.subtotal || 0)),
        taxAmount: round2(Number(order.taxAmount || 0)),
        total: round2(Number(order.total || 0)),
      },
      alreadyExisted: false,
      sourceOrder: { id: order.id, number: order.number },
    }, { status: 201 })
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {})
    console.error('[order convert-to-invoice]', error)
    return NextResponse.json({ error: 'Failed: ' + (error as Error).message }, { status: 500 })
  } finally {
    client.release()
  }
}