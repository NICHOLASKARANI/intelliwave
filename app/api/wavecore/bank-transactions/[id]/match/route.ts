export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireTenant(request)

    // Verify transaction belongs to tenant
    const txn = await pool.query(
      'SELECT id, "bankAccountId" FROM "BankTransaction" WHERE id = $1 AND "organizationId" = $2',
      [params.id, session!.organizationId]
    )

    if (txn.rows.length === 0) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
    }

    await pool.query(
      'UPDATE "BankTransaction" SET matched = true WHERE id = $1',
      [params.id]
    )

    // Update bank account balance
    await pool.query(
      `UPDATE "BankAccount" ba
       SET "currentBalance" = ba."openingBalance" + 
         (SELECT COALESCE(SUM(CASE WHEN type = 'CREDIT' THEN amount ELSE -amount END), 0)
          FROM "BankTransaction" bt WHERE bt."bankAccountId" = ba.id AND bt.matched = true)
       WHERE ba.id = $1`,
      [txn.rows[0].bankAccountId]
    )

    return NextResponse.json({ success: true, message: 'Transaction matched' })
  } catch (error) {
    console.error('Match error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}