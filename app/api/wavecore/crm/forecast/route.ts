export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

/**
 * GET /api/wavecore/crm/forecast?months=6
 *
 * Weighted revenue forecast by month. Reads all open opportunities,
 * buckets them by expectedCloseDate month, and computes:
 *   gross     — sum of amount
 *   weighted  — sum of amount * probability / 100
 *   count     — number of deals
 * Also returns a per-stage breakdown for the current open pipeline.
 *
 * Read-only. Tenant-scoped. Never writes.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const orgId = session.organizationId

    const { searchParams } = new URL(request.url)
    const months = Math.max(1, Math.min(24, parseInt(searchParams.get('months') || '6')))

    const r = await pool.query(
      `SELECT id, name, amount, stage, probability, "expectedCloseDate",
              "createdAt", "customerId"
       FROM "Opportunity"
       WHERE "organizationId" = $1
         AND stage NOT IN ('CLOSED_WON','CLOSED_LOST')
       ORDER BY "expectedCloseDate" ASC NULLS LAST, "createdAt" ASC`,
      [orgId]
    )

    const now = new Date()
    const buckets: Record<string, { month: string; label: string; gross: number; weighted: number; count: number; deals: any[] }> = {}

    // Pre-create buckets for the next N months
    for (let i = 0; i < months; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1)
      const key = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0')
      buckets[key] = {
        month: key,
        label: d.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }),
        gross: 0,
        weighted: 0,
        count: 0,
        deals: [],
      }
    }

    // Also a bucket for "no close date" and "past due"
    let noCloseDate = { gross: 0, weighted: 0, count: 0 }
    let pastDue = { gross: 0, weighted: 0, count: 0 }

    for (const row of r.rows) {
      const amt = Number(row.amount || 0)
      const prob = Math.max(0, Math.min(100, Number(row.probability || 0)))
      const weighted = amt * prob / 100

      if (!row.expectedCloseDate) {
        noCloseDate.gross += amt
        noCloseDate.weighted += weighted
        noCloseDate.count += 1
        continue
      }

      const d = new Date(row.expectedCloseDate)
      const key = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0')

      if (buckets[key]) {
        buckets[key].gross += amt
        buckets[key].weighted += weighted
        buckets[key].count += 1
        buckets[key].deals.push({
          id: row.id,
          name: row.name,
          amount: amt,
          probability: prob,
          stage: row.stage,
        })
      } else if (d.getTime() < now.getTime()) {
        pastDue.gross += amt
        pastDue.weighted += weighted
        pastDue.count += 1
      } else {
        // Beyond the window
      }
    }

    // Per-stage rollup of currently open pipeline
    const stageRollup: Record<string, { stage: string; gross: number; weighted: number; count: number }> = {}
    for (const row of r.rows) {
      const amt = Number(row.amount || 0)
      const prob = Math.max(0, Math.min(100, Number(row.probability || 0)))
      const s = row.stage || 'UNKNOWN'
      if (!stageRollup[s]) stageRollup[s] = { stage: s, gross: 0, weighted: 0, count: 0 }
      stageRollup[s].gross += amt
      stageRollup[s].weighted += amt * prob / 100
      stageRollup[s].count += 1
    }

    const totals = {
      gross: r.rows.reduce((s, x) => s + Number(x.amount || 0), 0),
      weighted: r.rows.reduce((s, x) => s + Number(x.amount || 0) * Math.max(0, Math.min(100, Number(x.probability || 0))) / 100, 0),
      count: r.rows.length,
    }

    return NextResponse.json({
      months,
      buckets: Object.values(buckets),
      noCloseDate,
      pastDue,
      stageRollup: Object.values(stageRollup),
      totals,
      generatedAt: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('Forecast error:', (error as Error).message)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}