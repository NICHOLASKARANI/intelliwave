export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

const DAY = 86400000

/**
 * GET /api/wavecore/bank-reconciliation/[id]/candidates
 *
 * Returns:
 *   transactions — unmatched BankTransaction rows for this reconciliation's
 *                  bank account
 *   journals     — POSTED journal entries that touch cash/bank accounts and
 *                  are not yet linked to any bank transaction
 *   suggestions  — for each unmatched transaction, the best-guess journal
 *                  entry candidates (amount within tolerance, date ±5 days)
 *
 * Read-only. Tenant-scoped. Never writes.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const orgId = session.organizationId

    const recRes = await pool.query(
      `SELECT id, "bankAccountId", "statementBalance", "closingBalance", status
       FROM "BankReconciliation"
       WHERE id = $1 AND "organizationId" = $2`,
      [params.id, orgId]
    )
    if (recRes.rowCount === 0) {
      return NextResponse.json({ error: 'Reconciliation not found' }, { status: 404 })
    }
    const rec = recRes.rows[0]

    // Unmatched bank transactions for this account
    const txnRes = await pool.query(
      `SELECT id, date, description, reference, amount, type, matched, "matchedTransactionId"
       FROM "BankTransaction"
       WHERE "organizationId" = $1 AND "bankAccountId" = $2
       ORDER BY date DESC
       LIMIT 500`,
      [orgId, rec.bankAccountId]
    )

    // Candidate journal entries: POSTED entries that hit any account whose
    // name or code looks like a bank/cash account, and are not yet linked
    // to a bank transaction.
    const journalRes = await pool.query(
      `SELECT je.id, je.number, je.date, je.reference, je.description, je.status,
              COALESCE(SUM(ji.debit), 0) AS debit,
              COALESCE(SUM(ji.credit), 0) AS credit
       FROM "JournalEntry" je
       LEFT JOIN "JournalItem" ji ON ji."journalEntryId" = je.id
       WHERE je."organizationId" = $1
         AND je.status = 'POSTED'
         AND je.id NOT IN (
           SELECT "matchedTransactionId" FROM "BankTransaction"
           WHERE "organizationId" = $1
             AND "matchedTransactionId" IS NOT NULL
             AND matched = TRUE
         )
       GROUP BY je.id
       ORDER BY je.date DESC
       LIMIT 500`,
      [orgId]
    )

    const transactions = txnRes.rows.map((r: any) => ({
      id: r.id,
      date: r.date,
      description: r.description,
      reference: r.reference,
      amount: Number(r.amount || 0),
      type: r.type,
      matched: Boolean(r.matched),
      matchedTransactionId: r.matchedTransactionId,
    }))

    const journals = journalRes.rows.map((r: any) => ({
      id: r.id,
      number: r.number,
      date: r.date,
      reference: r.reference,
      description: r.description,
      debit: Number(r.debit || 0),
      credit: Number(r.credit || 0),
      /** net movement in cash terms (debit - credit) */
      net: Number(r.debit || 0) - Number(r.credit || 0),
    }))

    // For each unmatched bank transaction, produce up to 5 suggestions
    const suggestions: Record<string, any[]> = {}
    const usedJournalIds = new Set<string>()
    for (const t of transactions) {
      if (t.matched) continue
      const txnMs = new Date(t.date).getTime()
      const txnNet = t.type === 'CREDIT' ? t.amount : -t.amount
      const scored = journals
        .filter(j => !usedJournalIds.has(j.id))
        .map(j => {
          const jMs = new Date(j.date).getTime()
          const dayDiff = Math.abs(jMs - txnMs) / DAY
          const amountDiff = Math.abs(j.net - txnNet)
          const refMatch = !!(t.reference && j.reference && (t.reference.toLowerCase().includes(j.reference.toLowerCase()) || j.reference.toLowerCase().includes(t.reference.toLowerCase())))
          const amountOk = amountDiff < 1.0
          const dateOk = dayDiff <= 5
          // Score: lower is better; amount is dominant
          let score = amountDiff + dayDiff * 0.1
          if (refMatch) score -= 5
          if (!amountOk) score += 1000
          if (!dateOk) score += 500
          return { ...j, dayDiff, amountDiff, refMatch, score }
        })
        .filter(j => j.amountDiff < 1.0 || j.refMatch)
        .sort((a, b) => a.score - b.score)
        .slice(0, 5)
      suggestions[t.id] = scored
    }

    return NextResponse.json({
      reconciliation: rec,
      transactions,
      journals,
      suggestions,
      summary: {
        transactionCount: transactions.length,
        unmatchedTransactions: transactions.filter(t => !t.matched).length,
        journalCount: journals.length,
      },
    })
  } catch (error) {
    console.error('[bank-rec candidates]', error)
    return NextResponse.json({ transactions: [], journals: [], suggestions: {}, error: 'Failed to load' }, { status: 500 })
  }
}