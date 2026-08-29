export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/wavecore/auth'
import { pool } from '@/lib/wavecore/db'

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const result = await pool.query(
      `SELECT ci.*, c.name as "customerName"
       FROM "CustomerInvoice" ci
       LEFT JOIN "Customer" c ON ci."customerId" = c.id
       WHERE ci."organizationId" = $1 
       ORDER BY ci."createdAt" DESC LIMIT 100`,
      [session.organizationId]
    )

    const totalInvoiced = result.rows.reduce((sum, inv) => sum + parseFloat(inv.total || 0), 0)
    const totalPaid = result.rows.filter(i => i.status === 'PAID').reduce((sum, inv) => sum + parseFloat(inv.total || 0), 0)

    return NextResponse.json({ invoices: result.rows, totalInvoiced, totalPaid })
  } catch (error) {
    console.error('Invoices GET error:', error)
    return NextResponse.json({ invoices: [], totalInvoiced: 0, totalPaid: 0 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const crypto = require('crypto')
    const id = crypto.randomUUID()
    const invoiceNumber = 'INV-' + Date.now().toString().slice(-8)

    // Check if customer exists, create if not
    let customerId = body.customerId
    if (!customerId && body.customerName) {
      const customerResult = await pool.query(
        `INSERT INTO "Customer" (id, name, "organizationId", "createdAt", "updatedAt")
         VALUES ($1, $2, $3, NOW(), NOW()) RETURNING id`,
        [crypto.randomUUID(), body.customerName, session.organizationId]
      )
      customerId = customerResult.rows[0].id
    }

    const result = await pool.query(
      `INSERT INTO "CustomerInvoice" (id, number, "dueDate", status, subtotal, "taxAmount", total, "customerId", "organizationId", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW()) RETURNING *`,
      [
        id,
        invoiceNumber,
        body.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        body.status || 'DRAFT',
        body.subtotal || body.total || 0,
        body.taxAmount || 0,
        body.total || 0,
        customerId || null,
        session.organizationId
      ]
    )

    return NextResponse.json({ invoice: result.rows[0] }, { status: 201 })
  } catch (error) {
    console.error('Invoice create error:', error)
    return NextResponse.json({ error: 'Create failed: ' + (error as Error).message }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const result = await pool.query(
      `UPDATE "CustomerInvoice" SET status = $1, "updatedAt" = NOW() WHERE id = $2 AND "organizationId" = $3 RETURNING *`,
      [body.status, body.id, session.organizationId]
    )
    return NextResponse.json({ invoice: result.rows[0] })
  } catch (error) {
    return NextResponse.json({ error: 'Update failed' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    await pool.query(`DELETE FROM "CustomerInvoice" WHERE id = $1 AND "organizationId" = $2`, [id, session.organizationId])
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
  }
}