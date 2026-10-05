export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'
import { ensureFixedAssetSchema } from '@/lib/wavecore/fixed-assets-schema'

const round2 = (n: number) => Math.round((Number(n) + Number.EPSILON) * 100) / 100

interface ScheduleRow {
  period: number
  date: string
  opening: number
  depreciation: number
  closing: number
  accumulated: number
  posted: boolean
}

/**
 * Recompute the schedule in-place. Kept in this file so the route is
 * self-contained (identical logic to the schedule endpoint — the two
 * can diverge only if someone changes one without the other).
 */
function buildSchedule(asset: any): ScheduleRow[] {
  const cost = round2(Number(asset.purchaseCost || 0))
  const residual = round2(Number(asset.residualValue || 0))
  const life = parseInt(asset.usefulLifeMonths || 0)
  const method = asset.method === 'DECLINING' ? 'DECLINING' : 'STRAIGHT_LINE'
  const accumulated = round2(Number(asset.accumulatedDepreciation || 0))
  const purchase = new Date(asset.purchaseDate)
  if (life <= 0) return []
  const base = round2(cost - residual)
  const alreadyPosted = Math.min(life, base > 0 ? Math.floor(accumulated / (base / life)) : 0)

  const rows: ScheduleRow[] = []
  let acc = 0
  let book = cost

  if (method === 'STRAIGHT_LINE') {
    const perMonth = round2(base / life)
    for (let i = 1; i <= life; i++) {
      const monthDate = new Date(Date.UTC(purchase.getUTCFullYear(), purchase.getUTCMonth() + i, 1))
      const thisMonth = i === life ? round2(base - acc) : perMonth
      const opening = book
      acc = round2(acc + thisMonth)
      book = round2(cost - acc)
      rows.push({ period: i, date: monthDate.toISOString().slice(0, 10), opening, depreciation: thisMonth, closing: book, accumulated: acc, posted: i <= alreadyPosted })
      if (book <= residual + 0.005) break
    }
  } else {
    const annualRate = Math.min(1, 2 / (life / 12))
    let remaining = base
    for (let i = 1; i <= life; i++) {
      const monthDate = new Date(Date.UTC(purchase.getUTCFullYear(), purchase.getUTCMonth() + i, 1))
      const opening = book
      let thisMonth = round2(Math.min(remaining, book * (annualRate / 12)))
      if (i === life) thisMonth = round2(remaining)
      acc = round2(acc + thisMonth)
      remaining = round2(remaining - thisMonth)
      book = round2(cost - acc)
      rows.push({ period: i, date: monthDate.toISOString().slice(0, 10), opening, depreciation: thisMonth, closing: book, accumulated: acc, posted: i <= alreadyPosted })
      if (book <= residual + 0.005) break
    }
  }
  return rows
}

/**
 * POST /api/wavecore/finance/assets/[id]/depreciate
 * Body: { date?: 'YYYY-MM-DD' } — optional, defaults to the next
 * unposted period's date. Posts one month of depreciation as a
 * POSTED journal entry:
 *   Dr depreciationExpenseAccountId
 *     Cr accumulatedDepreciationAccountId
 * Advances accumulatedDepreciation and lastDepreciatedAt on the asset.
 * Refuses if the asset lacks the two account ids, if it is not ACTIVE,
 * if it is fully depreciated, or if the date lands in a closed period.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const client = await pool.connect()
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    await ensureFixedAssetSchema()
    const orgId = session.organizationId

    const body = await request.json().catch(() => ({}))
    const assetRes = await client.query(
      `SELECT * FROM "FixedAsset" WHERE id = $1 AND "organizationId" = $2`,
      [params.id, orgId]
    )
    if (assetRes.rowCount === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    const asset = assetRes.rows[0]

    if (asset.status !== 'ACTIVE') return NextResponse.json({ error: 'Asset is not ACTIVE (status: ' + asset.status + ')' }, { status: 409 })
    if (!asset.depreciationExpenseAccountId || !asset.accumulatedDepreciationAccountId) {
      return NextResponse.json({
        error: 'Asset is missing depreciation account codes. Edit the asset and set depreciationExpenseAccountId and accumulatedDepreciationAccountId.',
      }, { status: 409 })
    }

    const schedule = buildSchedule(asset)
    const next = schedule.find(r => !r.posted)
    if (!next) return NextResponse.json({ error: 'Asset is already fully depreciated' }, { status: 409 })

    const postDate = body.date ? new Date(body.date) : new Date(next.date)
    if (isNaN(postDate.getTime())) return NextResponse.json({ error: 'Invalid date' }, { status: 400 })

    // FIN-8 lock
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

    const amount = round2(next.depreciation)
    if (amount <= 0) return NextResponse.json({ error: 'Zero depreciation for next period' }, { status: 409 })

    const crypto = require('crypto')
    const entryId = crypto.randomUUID()
    const entryNumber = 'DEP-' + asset.code + '-' + next.period
    const description = 'Depreciation ' + asset.code + ' ' + asset.name + ' (' + next.period + '/' + asset.usefulLifeMonths + ')'

    await client.query('BEGIN')

    await client.query(
      `INSERT INTO "JournalEntry"
         (id, number, date, reference, description, status, amount,
          "organizationId", "createdAt", "updatedAt")
       VALUES ($1,$2,$3,$4,$5,'POSTED',$6,$7,NOW(),NOW())`,
      [entryId, entryNumber, postDate, asset.code, description, amount, orgId]
    )

    // Dr depreciation expense
    await client.query(
      `INSERT INTO "JournalItem" (id, "journalEntryId", "accountId", debit, credit, "organizationId")
       VALUES ($1, $2, $3, $4, 0, $5)`,
      [crypto.randomUUID(), entryId, asset.depreciationExpenseAccountId, amount, orgId]
    )
    // Cr accumulated depreciation
    await client.query(
      `INSERT INTO "JournalItem" (id, "journalEntryId", "accountId", debit, credit, "organizationId")
       VALUES ($1, $2, $3, 0, $4, $5)`,
      [crypto.randomUUID(), entryId, asset.accumulatedDepreciationAccountId, amount, orgId]
    )

    const newAccum = round2(Number(asset.accumulatedDepreciation || 0) + amount)
    const newStatus = newAccum >= round2(Number(asset.purchaseCost || 0) - Number(asset.residualValue || 0)) - 0.005
      ? 'FULLY_DEPRECIATED'
      : 'ACTIVE'

    await client.query(
      `UPDATE "FixedAsset"
       SET "accumulatedDepreciation" = $1,
           "lastDepreciatedAt" = $2,
           status = $3,
           "updatedAt" = NOW()
       WHERE id = $4`,
      [newAccum, postDate, newStatus, params.id]
    )

    await client.query('COMMIT')

    return NextResponse.json({
      entry: { id: entryId, number: entryNumber, date: postDate, amount },
      asset: { id: params.id, accumulatedDepreciation: newAccum, status: newStatus },
      period: next.period,
    }, { status: 201 })
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {})
    console.error('[asset depreciate]', error)
    return NextResponse.json({ error: 'Failed: ' + (error as Error).message }, { status: 500 })
  } finally {
    client.release()
  }
}