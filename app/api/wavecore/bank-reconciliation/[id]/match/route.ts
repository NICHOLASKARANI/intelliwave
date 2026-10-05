export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

/**
 * POST /api/wavecore/bank-reconciliation/[id]/match
 * Body: { transactionId, journalEntryId }
 *
 * Links a BankTransaction to a JournalEntry. Uses the existing
 * "matchedTransactionId" column on BankTransaction to store the journal
 * entry id. Marks the transaction as matched. Recomputes the linked
 * BankAccount's currentBalance.
 *
 * Tenant-scoped. Never touches a transaction or journal outside the org.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const orgId = session.organizationId

    const body = await request.json().catch(() => null)
    if (!body || !body.transactionId || !body.journalEntryId) {
      return NextResponse.json({ error: 'transactionId and journalEntryId are required' }, { status: 400 })
    }

    // Verify reconciliation belongs to org
    const rec = await pool.query(
      `SELECT id, "bankAccountId" FROM "BankReconciliation" WHERE id = $1 AND "organizationId" = $2`,
      [params.id, orgId]
    )
    if (rec.rowCount === 0) return NextResponse.json({ error: 'Reconciliation not found' }, { status: 404 })

    // Verify transaction belongs to org AND to this reconciliation's bank account
    const txn = await pool.query(
      `SELECT id, "bankAccountId" FROM "BankTransaction"
       WHERE id = $1 AND "organizationId" = $2 AND "bankAccountId" = $3`,
      [body.transactionId, orgId, rec.rows[0].bankAccountId]
    )
    if (txn.rowCount === 0) {
      return NextResponse.json({ error: 'Transaction not found for this account' }, { status: 404 })
    }

    // Verify journal entry belongs to org and is POSTED
    const je = await pool.query(
      `SELECT id, status FROM "JournalEntry" WHERE id = $1 AND "organizationId" = $2`,
      [body.journalEntryId, orgId]
    )
    if (je.rowCount === 0) return NextResponse.json({ error: 'Journal entry not found' }, { status: 404 })
    if (je.rows[0].status !== 'POSTED') {
      return NextResponse.json({ error: 'Only POSTED journal entries can be matched' }, { status: 409 })
    }

    // Link + mark matched
    await pool.query(
      `UPDATE "BankTransaction"
       SET matched = TRUE, "matchedTransactionId" = $1
       WHERE id = $2 AND "organizationId" = $3`,
      [body.journalEntryId, body.transactionId, orgId]
    )

    // Recompute the linked BankAccount's current balance
    await pool.query(
      `UPDATE "BankAccount" ba
       SET "currentBalance" = ba."openingBalance" +
         (SELECT COALESCE(SUM(CASE WHEN type = 'CREDIT' THEN amount ELSE -amount END), 0)
          FROM "BankTransaction" bt
          WHERE bt."bankAccountId" = ba.id AND bt.matched = TRUE)
       WHERE ba.id = $1`,
      [rec.rows[0].bankAccountId]
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[bank-rec match]', error)
    return NextResponse.json({ error: 'Failed to match' }, { status: 500 })
  }
}

/**
 * DELETE /api/wavecore/bank-reconciliation/[id]/match?transactionId=...
 * Unlinks a matched transaction.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const orgId = session.organizationId

    const { searchParams } = new URL(request.url)
    const transactionId = searchParams.get('transactionId')
    if (!transactionId) return NextResponse.json({ error: 'transactionId is required' }, { status: 400 })

    const rec = await pool.query(
      `SELECT id, "bankAccountId" FROM "BankReconciliation" WHERE id = $1 AND "organizationId" = $2`,
      [params.id, orgId]
    )
    if (rec.rowCount === 0) return NextResponse.json({ error: 'Reconciliation not found' }, { status: 404 })

    await pool.query(
      `UPDATE "BankTransaction"
       SET matched = FALSE, "matchedTransactionId" = NULL
       WHERE id = $1 AND "organizationId" = $2 AND "bankAccountId" = $3`,
      [transactionId, orgId, rec.rows[0].bankAccountId]
    )

    // Recompute balance
    await pool.query(
      `UPDATE "BankAccount" ba
       SET "currentBalance" = ba."openingBalance" +
         (SELECT COALESCE(SUM(CASE WHEN type = 'CREDIT' THEN amount ELSE -amount END), 0)
          FROM "BankTransaction" bt
          WHERE bt."bankAccountId" = ba.id AND bt.matched = TRUE)
       WHERE ba.id = $1`,
      [rec.rows[0].bankAccountId]
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[bank-rec unmatch]', error)
    return NextResponse.json({ error: 'Failed to unmatch' }, { status: 500 })
  }
}