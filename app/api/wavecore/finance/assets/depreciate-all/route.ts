export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'
import { ensureFixedAssetSchema } from '@/lib/wavecore/fixed-assets-schema'

const round2 = (n: number) => Math.round((Number(n) + Number.EPSILON) * 100) / 100

function nextMonthCharge(asset: any): { period: number; date: Date; amount: number } | null {
  const cost = round2(Number(asset.purchaseCost || 0))
  const residual = round2(Number(asset.residualValue || 0))
  const life = parseInt(asset.usefulLifeMonths || 0)
  const accumulated = round2(Number(asset.accumulatedDepreciation || 0))
  const purchase = new Date(asset.purchaseDate)
  if (life <= 0) return null

  const base = round2(cost - residual)
  if (base <= 0) return null

  let remaining = round2(base - accumulated)
  if (remaining <= 0.005) return null

  const posted = asset.method === 'DECLINING'
    ? Math.round(accumulated / (base / life)) // approximate for DB method
    : Math.floor(accumulated / (base / life))
  const period = Math.min(life, posted + 1)
  const monthDate = new Date(Date.UTC(purchase.getUTCFullYear(), purchase.getUTCMonth() + period, 1))

  let charge: number
  if (asset.method === 'DECLINING') {
    const annualRate = Math.min(1, 2 / (life / 12))
    const bookBefore = round2(cost - accumulated)
    charge = round2(Math.min(remaining, bookBefore * (annualRate / 12)))
  } else {
    charge = round2(base / life)
    // Last period catch-up
    if (period === life) charge = remaining
  }
  if (charge <= 0) return null
  if (charge > remaining) charge = remaining
  return { period, date: monthDate, amount: round2(charge) }
}

/**
 * POST /api/wavecore/finance/assets/depreciate-all
 * Body: { date?: 'YYYY-MM-DD' }
 *
 * Posts one combined journal entry covering this month's depreciation
 * for every ACTIVE asset that has accounts set and a remaining balance.
 * Assets missing accounts are skipped and reported in the response.
 */
export async function POST(request: NextRequest) {
  const client = await pool.connect()
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    await ensureFixedAssetSchema()
    const orgId = session.organizationId

    const body = await request.json().catch(() => ({}))
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
      return NextResponse.json({ error: 'Cannot post depreciation into closed period: ' + lock.rows[0].name }, { status: 409 })
    }

    const assetsRes = await client.query(
      `SELECT * FROM "FixedAsset"
       WHERE "organizationId" = $1 AND status = 'ACTIVE'`,
      [orgId]
    )

    const toPost: { asset: any; period: number; amount: number }[] = []
    const skipped: { code: string; reason: string }[] = []

    for (const a of assetsRes.rows) {
      if (!a.depreciationExpenseAccountId || !a.accumulatedDepreciationAccountId) {
        skipped.push({ code: a.code, reason: 'missing depreciation accounts' })
        continue
      }
      const next = nextMonthCharge(a)
      if (!next) { skipped.push({ code: a.code, reason: 'fully depreciated' }); continue }
      toPost.push({ asset: a, period: next.period, amount: next.amount })
    }

    if (toPost.length === 0) {
      return NextResponse.json({ posted: 0, skipped, message: 'Nothing to depreciate this period.' })
    }

    const crypto = require('crypto')
    const entryId = crypto.randomUUID()
    const entryNumber = 'DEP-BATCH-' + Date.now().toString().slice(-8)
    const total = round2(toPost.reduce((s, x) => s + x.amount, 0))
    const description = 'Monthly depreciation batch (' + toPost.length + ' assets)'

    await client.query('BEGIN')

    await client.query(
      `INSERT INTO "JournalEntry"
         (id, number, date, reference, description, status, amount,
          "organizationId", "createdAt", "updatedAt")
       VALUES ($1,$2,$3,$4,$5,'POSTED',$6,$7,NOW(),NOW())`,
      [entryId, entryNumber, postDate, 'DEPRECIATION', description, total, orgId]
    )

    // Consolidate Dr and Cr per account so the entry has 2–N lines, not 2N.
    const debitByAccount = new Map<string, number>()
    const creditByAccount = new Map<string, number>()
    for (const x of toPost) {
      const dr = x.asset.depreciationExpenseAccountId
      const cr = x.asset.accumulatedDepreciationAccountId
      debitByAccount.set(dr, round2((debitByAccount.get(dr) || 0) + x.amount))
      creditByAccount.set(cr, round2((creditByAccount.get(cr) || 0) + x.amount))
    }

    for (const [acc, amt] of debitByAccount) {
      await client.query(
        `INSERT INTO "JournalItem" (id, "journalEntryId", "accountId", debit, credit, "organizationId")
         VALUES ($1,$2,$3,$4,0,$5)`,
        [crypto.randomUUID(), entryId, acc, amt, orgId]
      )
    }
    for (const [acc, amt] of creditByAccount) {
      await client.query(
        `INSERT INTO "JournalItem" (id, "journalEntryId", "accountId", debit, credit, "organizationId")
         VALUES ($1,$2,$3,0,$4,$5)`,
        [crypto.randomUUID(), entryId, acc, amt, orgId]
      )
    }

    for (const x of toPost) {
      const newAccum = round2(Number(x.asset.accumulatedDepreciation || 0) + x.amount)
      const base = round2(Number(x.asset.purchaseCost) - Number(x.asset.residualValue))
      const newStatus = newAccum >= base - 0.005 ? 'FULLY_DEPRECIATED' : 'ACTIVE'
      await client.query(
        `UPDATE "FixedAsset"
         SET "accumulatedDepreciation" = $1,
             "lastDepreciatedAt" = $2,
             status = $3,
             "updatedAt" = NOW()
         WHERE id = $4`,
        [newAccum, postDate, newStatus, x.asset.id]
      )
    }

    await client.query('COMMIT')

    return NextResponse.json({
      entry: { id: entryId, number: entryNumber, date: postDate, amount: total },
      posted: toPost.length,
      skipped,
    }, { status: 201 })
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {})
    console.error('[assets depreciate-all]', error)
    return NextResponse.json({ error: 'Failed: ' + (error as Error).message }, { status: 500 })
  } finally {
    client.release()
  }
}