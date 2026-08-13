export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant()

    const { searchParams } = new URL(request.url)
    const bankAccountId = searchParams.get('bankAccountId')

    if (!bankAccountId) {
      return NextResponse.json({ error: 'Bank account ID required' }, { status: 400 })
    }

    // Verify bank account belongs to tenant
    const account = await pool.query(
      'SELECT id, name, "openingBalance", "currentBalance" FROM "BankAccount" WHERE id = $1 AND "organizationId" = $2',
      [bankAccountId, session.organizationId]
    )

    if (account.rows.length === 0) {
      return NextResponse.json({ error: 'Bank account not found' }, { status: 404 })
    }

    const summary = await pool.query(
      `SELECT 
         COUNT(*) as total_transactions,
         COUNT(*) FILTER (WHERE matched = true) as matched,
         COUNT(*) FILTER (WHERE matched = false) as unmatched,
         COALESCE(SUM(CASE WHEN type = 'CREDIT' AND matched = true THEN amount ELSE 0 END), 0) as total_credits,
         COALESCE(SUM(CASE WHEN type = 'DEBIT' AND matched = true THEN amount ELSE 0 END), 0) as total_debits,
         COALESCE(SUM(CASE WHEN type = 'CREDIT' AND matched = false THEN amount ELSE 0 END), 0) as unmatched_credits,
         COALESCE(SUM(CASE WHEN type = 'DEBIT' AND matched = false THEN amount ELSE 0 END), 0) as unmatched_debits
       FROM "BankTransaction"
       WHERE "bankAccountId" = $1 AND "organizationId" = $2`,
      [bankAccountId, session.organizationId]
    )

    return NextResponse.json({
      bankAccount: account.rows[0],
      summary: summary.rows[0],
    })
  } catch (error) {
    console.error('Reconciliation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}