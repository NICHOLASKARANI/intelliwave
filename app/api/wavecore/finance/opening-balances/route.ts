export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

const OPENING_TAG = '[OPENING BALANCE]'
const round2 = (n: number) => Math.round((Number(n) + Number.EPSILON) * 100) / 100

/**
 * GET /api/wavecore/finance/opening-balances
 *
 * Returns every ChartOfAccount for this org, plus the debit/credit
 * already posted to each from the org's opening-balance journal entry
 * (an entry whose description starts with "[OPENING BALANCE]").
 * Read-only. Tenant-scoped.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const orgId = session.organizationId

    const accountsRes = await pool.query(
      `SELECT id, code, name, type, "isActive"
       FROM "ChartOfAccount"
       WHERE "organizationId" = $1 AND "isActive" = TRUE
       ORDER BY code ASC`,
      [orgId]
    )

    // Current opening-balance entry (single) — the one we manage.
    const obRes = await pool.query(
      `SELECT je.id, je.number, je.date, je.description, je.status
       FROM "JournalEntry" je
       WHERE je."organizationId" = $1
         AND je.description LIKE $2
       ORDER BY je."createdAt" DESC
       LIMIT 1`,
      [orgId, OPENING_TAG + '%']
    )

    const currentEntry = obRes.rows[0] || null
    const entriesByAccount: Record<string, { debit: number; credit: number }> = {}

    if (currentEntry) {
      const itemsRes = await pool.query(
        `SELECT "accountId", COALESCE(debit,0) AS debit, COALESCE(credit,0) AS credit
         FROM "JournalItem"
         WHERE "journalEntryId" = $1`,
        [currentEntry.id]
      )
      for (const row of itemsRes.rows) {
        entriesByAccount[row.accountId] = {
          debit: Number(row.debit || 0),
          credit: Number(row.credit || 0),
        }
      }
    }

    const accounts = accountsRes.rows.map((a: any) => ({
      id: a.id,
      code: a.code,
      name: a.name,
      type: a.type,
      debit: entriesByAccount[a.id]?.debit || 0,
      credit: entriesByAccount[a.id]?.credit || 0,
    }))

    const totalDebit  = round2(accounts.reduce((s, a) => s + a.debit, 0))
    const totalCredit = round2(accounts.reduce((s, a) => s + a.credit, 0))
    const difference  = round2(totalDebit - totalCredit)

    return NextResponse.json({
      accounts,
      currentEntry,
      totals: { debit: totalDebit, credit: totalCredit, difference },
    })
  } catch (error) {
    console.error('[opening-balances GET]', error)
    return NextResponse.json({ accounts: [], currentEntry: null, totals: {}, error: 'Failed to load' }, { status: 500 })
  }
}

/**
 * POST /api/wavecore/finance/opening-balances
 *
 * Body: { asOf: 'YYYY-MM-DD', lines: [{ accountId, debit, credit }] }
 *
 * Creates (or replaces) a single opening-balance journal entry, POSTED.
 * Idempotent: if an opening entry already exists, its items and entry
 * are deleted first, then the new one is written — so users can edit
 * and re-save without creating duplicates.
 *
 * Requires debits = credits (within KES 0.01).
 * Respects FIN-8's closed-period lock.
 */
export async function POST(request: NextRequest) {
  const client = await pool.connect()
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const orgId = session.organizationId

    const body = await request.json().catch(() => null)
    if (!body || !Array.isArray(body.lines)) {
      return NextResponse.json({ error: 'lines[] is required' }, { status: 400 })
    }

    const asOfStr = body.asOf || new Date().toISOString().slice(0, 10)
    const asOf = new Date(asOfStr)
    if (isNaN(asOf.getTime())) return NextResponse.json({ error: 'Invalid asOf date' }, { status: 400 })

    // Normalise lines — keep only accounts with a non-zero amount
    const lines = body.lines
      .map((l: any) => ({
        accountId: String(l.accountId || ''),
        debit:  round2(Number(l.debit || 0)),
        credit: round2(Number(l.credit || 0)),
      }))
      .filter((l: any) => l.accountId && (l.debit !== 0 || l.credit !== 0))

    if (lines.length < 2) {
      return NextResponse.json({ error: 'At least two lines with non-zero amounts are required' }, { status: 400 })
    }
    if (lines.some((l: any) => l.debit < 0 || l.credit < 0)) {
      return NextResponse.json({ error: 'Amounts must be non-negative' }, { status: 400 })
    }
    if (lines.some((l: any) => l.debit > 0 && l.credit > 0)) {
      return NextResponse.json({ error: 'Each line must be either a debit or a credit, not both' }, { status: 400 })
    }

    const totalDebit  = round2(lines.reduce((s: number, l: any) => s + l.debit, 0))
    const totalCredit = round2(lines.reduce((s: number, l: any) => s + l.credit, 0))
    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      return NextResponse.json({
        error: 'Opening balances do not balance. Debits ' + totalDebit + ' vs credits ' + totalCredit,
      }, { status: 400 })
    }

    // Verify every accountId belongs to this org
    const ids = lines.map((l: any) => l.accountId)
    const check = await client.query(
      `SELECT id FROM "ChartOfAccount" WHERE "organizationId" = $1 AND id = ANY($2::text[])`,
      [orgId, ids]
    )
    if (check.rowCount !== ids.length) {
      return NextResponse.json({ error: 'One or more accounts do not belong to this organization' }, { status: 400 })
    }

    // FIN-8 lock: refuse if any part of the range falls inside a closed period
    const lockCheck = await client.query(
      `SELECT p.name FROM "FiscalPeriod" p
       JOIN "FiscalYear" y ON y.id = p."fiscalYearId"
       WHERE y."organizationId" = $1
         AND p."isClosed" = TRUE
         AND $2::date >= p."startDate"
         AND $2::date < p."endDate"
       LIMIT 1`,
      [orgId, asOf]
    )
    if (lockCheck.rowCount > 0) {
      return NextResponse.json({
        error: 'Cannot post opening balances into a closed period: ' + lockCheck.rows[0].name,
      }, { status: 409 })
    }

    const crypto = require('crypto')
    const entryId = crypto.randomUUID()
    const entryNumber = 'OB-' + Date.now().toString().slice(-8)
    const description = OPENING_TAG + ' as of ' + asOf.toISOString().slice(0, 10)

    await client.query('BEGIN')

    // Delete any previous opening-balance entry (and its items) so this
    // is a replace, not an append.
    const prev = await client.query(
      `SELECT id FROM "JournalEntry" WHERE "organizationId" = $1 AND description LIKE $2`,
      [orgId, OPENING_TAG + '%']
    )
    if (prev.rowCount > 0) {
      const prevIds = prev.rows.map((r: any) => r.id)
      await client.query(`DELETE FROM "JournalItem" WHERE "journalEntryId" = ANY($1::text[])`, [prevIds])
      await client.query(`DELETE FROM "JournalEntry" WHERE id = ANY($1::text[])`, [prevIds])
    }

    // Insert the new entry
    const entryRes = await client.query(
      `INSERT INTO "JournalEntry"
         (id, number, date, reference, description, status, amount,
          "organizationId", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, 'POSTED', $6, $7, NOW(), NOW())
       RETURNING *`,
      [entryId, entryNumber, asOf, 'Opening balances', description, totalDebit, orgId]
    )

    // Insert items
    for (const l of lines) {
      await client.query(
        `INSERT INTO "JournalItem" (id, "journalEntryId", "accountId", debit, credit, "organizationId")
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [crypto.randomUUID(), entryId, l.accountId, l.debit, l.credit, orgId]
      )
    }

    await client.query('COMMIT')

    return NextResponse.json({
      entry: entryRes.rows[0],
      lineCount: lines.length,
      totalDebit,
      totalCredit,
    }, { status: 201 })
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {})
    console.error('[opening-balances POST]', error)
    return NextResponse.json({ error: 'Failed to save: ' + (error as Error).message }, { status: 500 })
  } finally {
    client.release()
  }
}