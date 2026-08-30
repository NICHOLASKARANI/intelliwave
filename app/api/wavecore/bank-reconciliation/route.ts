export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/wavecore/auth'
import { pool } from '@/lib/wavecore/db'

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const result = await pool.query(
      `SELECT br.*, ba.name as "accountName", ba."accountNumber", ba."bankName"
       FROM "BankReconciliation" br
       LEFT JOIN "BankAccount" ba ON br."bankAccountId" = ba.id
       WHERE br."organizationId" = $1
       ORDER BY br."createdAt" DESC LIMIT 100`,
      [session.organizationId]
    )

    return NextResponse.json({ 
      reconciliations: result.rows,
      totalMatched: result.rows.filter(r => r.status === 'MATCHED').length,
      totalUnmatched: result.rows.filter(r => r.status === 'UNMATCHED').length,
      count: result.rows.length
    })
  } catch (error) {
    console.error('Reconciliation GET error:', error)
    return NextResponse.json({ reconciliations: [], totalMatched: 0, totalUnmatched: 0, count: 0 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const crypto = require('crypto')
    const id = crypto.randomUUID()

    const statementBalance = Number(body.statementBalance || 0)
    const bookBalance = Number(body.bookBalance || 0)
    const difference = statementBalance - bookBalance
    const status = Math.abs(difference) < 0.01 ? 'MATCHED' : 'UNMATCHED'

    const result = await pool.query(
      `INSERT INTO "BankReconciliation" (id, "bankAccountId", "statementBalance", "bookBalance", difference, status, "organizationId", "createdAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW()) RETURNING *`,
      [id, body.bankAccountId, statementBalance, bookBalance, difference, status, session.organizationId]
    )

    return NextResponse.json({ reconciliation: result.rows[0] }, { status: 201 })
  } catch (error) {
    console.error('Reconciliation create error:', error)
    return NextResponse.json({ error: 'Create failed: ' + (error as Error).message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    await pool.query(`DELETE FROM "BankReconciliation" WHERE id = $1 AND "organizationId" = $2`, [id, session.organizationId])
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
  }
}