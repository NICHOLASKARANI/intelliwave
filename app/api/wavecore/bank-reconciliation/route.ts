export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const bankAccountId = searchParams.get('bankAccountId')

    // If no bankAccountId, return list of accounts instead of 400
    if (!bankAccountId) {
      const accounts = await pool.query(
        `SELECT id, name, "currentBalance" FROM "BankAccount" WHERE "organizationId" = $1`,
        [session.organizationId]
      )
      return NextResponse.json({ accounts: accounts.rows, message: 'Select a bank account' })
    }

    const account = await pool.query(
      `SELECT id, name FROM "BankAccount" WHERE id = $1 AND "organizationId" = $2`,
      [bankAccountId, session.organizationId]
    )

    if (account.rows.length === 0) {
      return NextResponse.json({ error: 'Bank account not found' }, { status: 404 })
    }

    const transactions = await pool.query(
      `SELECT * FROM "BankTransaction" WHERE "bankAccountId" = $1 ORDER BY date DESC`,
      [bankAccountId]
    )

    return NextResponse.json({
      account: account.rows[0],
      transactions: transactions.rows,
      reconciled: 0,
      unreconciled: transactions.rows.length,
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch reconciliation: ' + error.message }, { status: 500 })
  }
}