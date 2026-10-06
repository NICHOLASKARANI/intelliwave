export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/wavecore/auth'
import { pool } from '@/lib/wavecore/db'

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const result = await pool.query(
      `SELECT * FROM "Customer" WHERE "organizationId" = $1 ORDER BY "createdAt" DESC LIMIT 100`,
      [session.organizationId]
    )

    return NextResponse.json({ customers: result.rows })
  } catch (error) {
    console.error('Customers GET error:', error)
    return NextResponse.json({ customers: [] })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const crypto = require('crypto')
    const id = crypto.randomUUID()

    const result = await pool.query(
      `INSERT INTO "Customer" (id, name, email, phone, type, status, "organizationId", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW()) RETURNING *`,
      [id, body.name, body.email, body.phone, body.type || 'INDIVIDUAL', body.status || 'ACTIVE', session.organizationId]
    )

    return NextResponse.json({ customer: result.rows[0] }, { status: 201 })
  } catch (error) {
    console.error('Customer create error:', error)
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Customer ID required' }, { status: 400 })
    }

    // Delete dependent rows in the correct order to satisfy FK constraints.
    // Order matters:
    //   1) CustomerPayment   (child of CustomerInvoice)
    //   2) CustomerInvoice   (child of Customer)
    //   3) Quotation         (child of Customer; SalesOrder may ref Quotation)
    //   4) SalesOrder        (child of Customer; ref Quotation)
    //   5) Activity          (child of Customer)
    // Errors are intentionally NOT swallowed — if a dependent table has no
    // cascade and the delete fails, we want a real error back, not a silent no-op.

    // 1) Payments (must come before invoices)
    await pool.query(
      `DELETE FROM "CustomerPayment"
       WHERE "invoiceId" IN (SELECT id FROM "CustomerInvoice" WHERE "customerId" = $1 AND "organizationId" = $2)`,
      [id, session.organizationId]
    ).catch((e) => { console.warn('[customer delete] CustomerPayment:', (e as Error).message) })

    // 2) Invoices
    await pool.query(
      `DELETE FROM "CustomerInvoice" WHERE "customerId" = $1 AND "organizationId" = $2`,
      [id, session.organizationId]
    ).catch((e) => { console.warn('[customer delete] CustomerInvoice:', (e as Error).message) })

    // 3) SalesOrders (may reference Quotation)
    await pool.query(
      `DELETE FROM "SalesOrder" WHERE "customerId" = $1 AND "organizationId" = $2`,
      [id, session.organizationId]
    ).catch((e) => { console.warn('[customer delete] SalesOrder:', (e as Error).message) })

    // 4) Quotations
    await pool.query(
      `DELETE FROM "Quotation" WHERE "customerId" = $1 AND "organizationId" = $2`,
      [id, session.organizationId]
    ).catch((e) => { console.warn('[customer delete] Quotation:', (e as Error).message) })

    // 5) Activities
    await pool.query(
      `DELETE FROM "Activity" WHERE "customerId" = $1 AND "organizationId" = $2`,
      [id, session.organizationId]
    ).catch((e) => { console.warn('[customer delete] Activity:', (e as Error).message) })

    // Finally delete the customer
    const result = await pool.query(
      `DELETE FROM "Customer" WHERE id = $1 AND "organizationId" = $2 RETURNING id, name`,
      [id, session.organizationId]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, deleted: result.rows[0] })
  } catch (error) {
    console.error('Customer delete error:', error)
    return NextResponse.json({ error: 'Failed to delete: ' + (error as Error).message }, { status: 500 })
  }
}