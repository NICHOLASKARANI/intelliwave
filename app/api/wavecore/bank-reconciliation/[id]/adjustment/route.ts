export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

const round2 = (n: number) => Math.round((Number(n) + Number.EPSILON) * 100) / 100
const TAG_PREFIX = '[BANK REC ADJUSTMENT]'

/**
 * POST /api/wavecore/bank-reconciliation/[id]/adjustment
 * Body: { bankAccountId, offsetAccountId, date? }
 *
 * Posts a single journal entry to bring the book balance in line with
 * the statement balance for this reconciliation.
 *
 *   difference = statementBalance - bookBalance
 *     > 0  →  Dr bankAccountId, Cr offsetAccountId  (books understated cash)
 *     < 0  →  Dr offsetAccountId, Cr bankAccountId  (books overstated cash)
 *
 * Idempotent per reconciliation: any prior adjustment tagged with this
 * reconciliation id is deleted first, so re-running replaces rather than
 * duplicates.
 *
 * Refuses if:
 *   - |difference| < 0.01                        (already balanced)
 *   - accounts don't belong to the org
 *   - accounts are the same
 *   - the target date lands in a closed fiscal period (FIN-8 lock)
 *
 * Tenant-scoped. The reconciliation is read, not mutated.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const client = await pool.connect()
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const orgId = session.organizationId

    const body = await request.json().catch(() => null)
    if (!body || !body.bankAccountId || !body.offsetAccountId) {
      return NextResponse.json({ error: 'bankAccountId and offsetAccountId are required' }, { status: 400 })
    }
    if (body.bankAccountId === body.offsetAccountId) {
      return NextResponse.json({ error: 'The two accounts must be different' }, { status: 400 })
    }

    // Resolve the reconciliation
    const recRes = await client.query(
      `SELECT id, "bankAccountId", "statementBalance",
              COALESCE(NULLIF("bookBalance", 0), "closingBalance", 0) AS book
       FROM "BankReconciliation"
       WHERE id = $1 AND "organizationId" = $2`,
      [params.id, orgId]
    )
    if (recRes.rowCount === 0) return NextResponse.json({ error: 'Reconciliation not found' }, { status: 404 })
    const rec = recRes.rows[0]

    const statementBalance = round2(Number(rec.statementBalance || 0))
    const bookBalance = round2(Number(rec.book || 0))
    const difference = round2(statementBalance - bookBalance)

    if (Math.abs(difference) < 0.01) {
      return NextResponse.json({
        error: 'Already balanced — nothing to adjust',
        statementBalance, bookBalance, difference,
      }, { status: 409 })
    }

    // Verify both CoA accounts belong to the org
    const acctRes = await client.query(
      `SELECT id, code, name, type FROM "ChartOfAccount"
       WHERE "organizationId" = $1 AND id = ANY($2::text[])`,
      [orgId, [body.bankAccountId, body.offsetAccountId]]
    )
    if (acctRes.rowCount !== 2) {
      return NextResponse.json({ error: 'One or both accounts do not belong to this organization' }, { status: 400 })
    }

    const bankAccount = acctRes.rows.find((a: any) => a.id === body.bankAccountId)
    const offsetAccount = acctRes.rows.find((a: any) => a.id === body.offsetAccountId)

    // FIN-8 lock check
    const postDate = body.date ? new Date(body.date) : new Date()
    if (isNaN(postDate.getTime())) return NextResponse.json({ error: 'Invalid date' }, { status: 400 })

    const lock = await client.query(
      `SELECT p.name FROM "FiscalPeriod" p
       JOIN "FiscalYear" y ON y.id = p."fiscalYearId"
       WHERE y."organizationId" = $1
         AND p."isClosed" = TRUE
         AND $2::date >= p."startDate"
         AND $2::date < p."endDate"
       LIMIT 1`,
      [orgId, postDate]
    )
    if (lock.rowCount > 0) {
      return NextResponse.json({
        error: 'Cannot post adjustment into closed period: ' + lock.rows[0].name,
      }, { status: 409 })
    }

    // Decide debit/credit direction
    const amount = round2(Math.abs(difference))
    const debitAccountId  = difference > 0 ? bankAccount.id   : offsetAccount.id
    const creditAccountId = difference > 0 ? offsetAccount.id : bankAccount.id
    const direction = difference > 0
      ? 'Dr ' + bankAccount.code + ' / Cr ' + offsetAccount.code
      : 'Dr ' + offsetAccount.code + ' / Cr ' + bankAccount.code

    const crypto = require('crypto')
    const entryId = crypto.randomUUID()
    const entryNumber = 'BRADJ-' + Date.now().toString().slice(-8)
    const description = TAG_PREFIX + ' rec ' + params.id

    await client.query('BEGIN')

    // Idempotency: replace any prior adjustment tagged with this rec id
    const prev = await client.query(
      `SELECT id FROM "JournalEntry"
       WHERE "organizationId" = $1 AND description = $2`,
      [orgId, description]
    )
    if (prev.rowCount > 0) {
      const prevIds = prev.rows.map((r: any) => r.id)
      await client.query(`DELETE FROM "JournalItem" WHERE "journalEntryId" = ANY($1::text[])`, [prevIds])
      await client.query(`DELETE FROM "JournalEntry" WHERE id = ANY($1::text[])`, [prevIds])
    }

    await client.query(
      `INSERT INTO "JournalEntry"
         (id, number, date, reference, description, status, amount,
          "organizationId", "createdAt", "updatedAt")
       VALUES ($1,$2,$3,$4,$5,'POSTED',$6,$7,NOW(),NOW())`,
      [entryId, entryNumber, postDate, 'BANK-REC-ADJ', description, amount, orgId]
    )

    await client.query(
      `INSERT INTO "JournalItem" (id, "journalEntryId", "accountId", debit, credit, "organizationId")
       VALUES ($1, $2, $3, $4, 0, $5)`,
      [crypto.randomUUID(), entryId, debitAccountId, amount, orgId]
    )
    await client.query(
      `INSERT INTO "JournalItem" (id, "journalEntryId", "accountId", debit, credit, "organizationId")
       VALUES ($1, $2, $3, 0, $4, $5)`,
      [crypto.randomUUID(), entryId, creditAccountId, amount, orgId]
    )

    await client.query('COMMIT')

    return NextResponse.json({
      entry: {
        id: entryId, number: entryNumber, date: postDate,
        amount, description, direction,
      },
      breakdown: {
        statementBalance, bookBalance, difference, amount,
        debitAccount:  { id: debitAccountId,  code: difference > 0 ? bankAccount.code   : offsetAccount.code,  name: difference > 0 ? bankAccount.name   : offsetAccount.name },
        creditAccount: { id: creditAccountId, code: difference > 0 ? offsetAccount.code : bankAccount.code,    name: difference > 0 ? offsetAccount.name : bankAccount.name },
      },
    }, { status: 201 })
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {})
    console.error('[bank-rec adjustment]', error)
    return NextResponse.json({ error: 'Failed: ' + (error as Error).message }, { status: 500 })
  } finally {
    client.release()
  }
}

/**
 * DELETE /api/wavecore/bank-reconciliation/[id]/adjustment
 * Removes the adjustment entry for this reconciliation, if any.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const orgId = session.organizationId

    const description = TAG_PREFIX + ' rec ' + params.id

    const prev = await pool.query(
      `SELECT id FROM "JournalEntry"
       WHERE "organizationId" = $1 AND description = $2`,
      [orgId, description]
    )

    if (prev.rowCount === 0) return NextResponse.json({ success: true, removed: 0 })

    const prevIds = prev.rows.map((r: any) => r.id)
    await pool.query(`DELETE FROM "JournalItem" WHERE "journalEntryId" = ANY($1::text[])`, [prevIds])
    await pool.query(`DELETE FROM "JournalEntry" WHERE id = ANY($1::text[])`, [prevIds])

    return NextResponse.json({ success: true, removed: prevIds.length })
  } catch (error) {
    console.error('[bank-rec adjustment DELETE]', error)
    return NextResponse.json({ error: 'Failed to remove' }, { status: 500 })
  }
}