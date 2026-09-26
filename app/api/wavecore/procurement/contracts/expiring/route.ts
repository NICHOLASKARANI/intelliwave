export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { assertProcurement, procurementHandler } from '@/lib/wavecore/procurement-guard'

/**
 * GET /api/wavecore/procurement/contracts/expiring?days=60
 * Returns ACTIVE contracts whose endDate is within N days
 * OR whose endDate + renewalNoticeDays has already passed.
 */
export const GET = procurementHandler(async (request: NextRequest) => {
  const g = await assertProcurement(request, 'READ')
  const { searchParams } = new URL(request.url)
  const days = Math.min(Math.max(parseInt(searchParams.get('days') || '60', 10) || 60, 1), 365)

  const r = await pool.query(
    `SELECT
       id, "contractNumber", title, "supplierName", type,
       "startDate", "endDate", value, currency, status,
       "autoRenew", "renewalNoticeDays",
       EXTRACT(DAY FROM ("endDate" - NOW()))::int AS "daysToExpiry"
     FROM "SupplierContract"
     WHERE "organizationId" = $1
       AND status = 'ACTIVE'
       AND "endDate" IS NOT NULL
       AND "endDate" <= NOW() + ($2 || ' days')::interval
     ORDER BY "endDate" ASC`,
    [g.organizationId, String(days)]
  )

  return NextResponse.json({
    days,
    count: r.rowCount,
    contracts: r.rows,
  })
})