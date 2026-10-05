export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'
import { ensureFixedAssetSchema } from '@/lib/wavecore/fixed-assets-schema'

const round2 = (n: number) => Math.round((Number(n) + Number.EPSILON) * 100) / 100

interface Row {
  period: number
  date: string
  opening: number
  depreciation: number
  closing: number
  accumulated: number
  posted: boolean
}

/**
 * Compute the straight-line or declining-balance schedule for one asset.
 * Pure function — nothing here writes.
 */
function buildSchedule(asset: any): Row[] {
  const cost = round2(Number(asset.purchaseCost || 0))
  const residual = round2(Number(asset.residualValue || 0))
  const life = parseInt(asset.usefulLifeMonths || 0)
  const method = asset.method === 'DECLINING' ? 'DECLINING' : 'STRAIGHT_LINE'
  const accumulated = round2(Number(asset.accumulatedDepreciation || 0))
  const purchase = new Date(asset.purchaseDate)

  if (life <= 0) return []

  const depreciableBase = round2(cost - residual)

  // How many months have already been posted?
  const alreadyPostedMonths = Math.min(
    life,
    depreciableBase > 0 ? Math.floor(accumulated / (depreciableBase / life)) : 0
  )

  const rows: Row[] = []
  let acc = 0
  let book = cost

  if (method === 'STRAIGHT_LINE') {
    const perMonth = round2(depreciableBase / life)
    for (let i = 1; i <= life; i++) {
      const monthDate = new Date(Date.UTC(purchase.getUTCFullYear(), purchase.getUTCMonth() + i, 1))
      // Last month absorbs rounding so the final accumulated exactly equals base
      const thisMonth = i === life ? round2(depreciableBase - acc) : perMonth
      const opening = book
      acc = round2(acc + thisMonth)
      book = round2(cost - acc)
      rows.push({
        period: i,
        date: monthDate.toISOString().slice(0, 10),
        opening,
        depreciation: thisMonth,
        closing: book,
        accumulated: acc,
        posted: i <= alreadyPostedMonths,
      })
      if (book <= residual + 0.005) break
    }
  } else {
    // Declining balance at 2x straight-line rate (double-declining)
    const annualRate = Math.min(1, (2 / (life / 12)))
    let remaining = depreciableBase
    for (let i = 1; i <= life; i++) {
      const monthDate = new Date(Date.UTC(purchase.getUTCFullYear(), purchase.getUTCMonth() + i, 1))
      const opening = book
      // Month charge = opening book * (annual rate / 12), capped by remaining
      let thisMonth = round2(Math.min(remaining, book * (annualRate / 12)))
      if (i === life) thisMonth = round2(remaining)
      acc = round2(acc + thisMonth)
      remaining = round2(remaining - thisMonth)
      book = round2(cost - acc)
      rows.push({
        period: i,
        date: monthDate.toISOString().slice(0, 10),
        opening,
        depreciation: thisMonth,
        closing: book,
        accumulated: acc,
        posted: i <= alreadyPostedMonths,
      })
      if (book <= residual + 0.005) break
    }
  }

  return rows
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    await ensureFixedAssetSchema()

    const r = await pool.query(
      `SELECT * FROM "FixedAsset" WHERE id = $1 AND "organizationId" = $2`,
      [params.id, session.organizationId]
    )
    if (r.rowCount === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const asset = r.rows[0]
    const rows = buildSchedule(asset)

    // Which period is next to post?
    const nextRow = rows.find(x => !x.posted) || null

    return NextResponse.json({
      asset,
      schedule: rows,
      nextPeriod: nextRow ? nextRow.period : null,
      fullyDepreciated: rows.length > 0 && rows.every(x => x.posted),
    })
  } catch (error) {
    console.error('[asset schedule]', error)
    return NextResponse.json({ error: 'Failed to compute schedule' }, { status: 500 })
  }
}