export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/wavecore/auth'
import { pool } from '@/lib/wavecore/db'

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const result = await pool.query(
      `SELECT * FROM "Invoice" WHERE "organizationId" = $1 ORDER BY "createdAt" DESC LIMIT 100`,
      [session.organizationId]
    )

    const totalInvoiced = result.rows.reduce((sum, inv) => sum + parseFloat(inv.total || 0), 0)
    const totalPaid = result.rows.filter(i => i.status === 'PAID').reduce((sum, inv) => sum + parseFloat(inv.total || 0), 0)

    return NextResponse.json({ invoices: result.rows, totalInvoiced, totalPaid })
  } catch (error) {
    return NextResponse.json({ invoices: [] })
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

    const result = await pool.query(
      `INSERT INTO "Invoice" (id, "invoiceNumber", "customerName", total, status, "dueDate", "organizationId", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW()) RETURNING *`,
      [id, invoiceNumber, body.customerName, body.total, body.status || 'PENDING', body.dueDate, session.organizationId]
    )

    return NextResponse.json({ invoice: result.rows[0] }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Create failed' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const result = await pool.query(
      `UPDATE "Invoice" SET status = $1, "updatedAt" = NOW() WHERE id = $2 AND "organizationId" = $3 RETURNING *`,
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
    await pool.query(`DELETE FROM "Invoice" WHERE id = $1 AND "organizationId" = $2`, [id, session.organizationId])
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
  }
}