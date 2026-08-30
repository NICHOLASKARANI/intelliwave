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

    // Delete related records first (to handle foreign key constraints)
    await pool.query(`DELETE FROM "CustomerInvoice" WHERE "customerId" = $1`, [id]).catch(() => {})
    await pool.query(`DELETE FROM "Quotation" WHERE "customerId" = $1`, [id]).catch(() => {})
    await pool.query(`DELETE FROM "SalesOrder" WHERE "customerId" = $1`, [id]).catch(() => {})
    await pool.query(`DELETE FROM "CustomerPayment" WHERE "invoiceId" IN (SELECT id FROM "CustomerInvoice" WHERE "customerId" = $1)`, [id]).catch(() => {})
    await pool.query(`DELETE FROM "Activity" WHERE "customerId" = $1`, [id]).catch(() => {})

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