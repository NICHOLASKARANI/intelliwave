export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/wavecore/auth'
import { pool } from '@/lib/wavecore/db'

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const result = await pool.query(
      `SELECT cp.*, ci.number as "invoiceNumber", c.name as "customerName"
       FROM "CustomerPayment" cp
       LEFT JOIN "CustomerInvoice" ci ON cp."invoiceId" = ci.id
       LEFT JOIN "Customer" c ON ci."customerId" = c.id
       WHERE cp."organizationId" = $1
       ORDER BY cp."createdAt" DESC LIMIT 100`,
      [session.organizationId]
    )

    const payments = result.rows
    const totalReceived = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0)

    return NextResponse.json({ payments, totalReceived, count: payments.length })
  } catch (error) {
    console.error('Payments GET error:', error)
    return NextResponse.json({ payments: [], totalReceived: 0, count: 0 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const crypto = require('crypto')
    const id = crypto.randomUUID()
    const number = 'PAY-' + Date.now().toString().slice(-8)

    const result = await pool.query(
      `INSERT INTO "CustomerPayment" (id, "number", amount, method, "invoiceId", "organizationId", "createdAt")
       VALUES ($1, $2, $3, $4, $5, $6, NOW()) RETURNING *`,
      [id, number, body.amount, body.method || 'MPESA', body.invoiceId || null, session.organizationId]
    )

    return NextResponse.json({ payment: result.rows[0] }, { status: 201 })
  } catch (error) {
    console.error('Payment create error:', error)
    return NextResponse.json({ error: 'Create failed: ' + (error as Error).message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    await pool.query(`DELETE FROM "CustomerPayment" WHERE id = $1 AND "organizationId" = $2`, [id, session.organizationId])
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
  }
}