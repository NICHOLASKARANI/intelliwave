export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { assertProcurement, procurementHandler } from '@/lib/wavecore/procurement-guard'

/**
 * GET /api/wavecore/procurement/approvals/counts
 * Fast dashboard counters.
 */
export const GET = procurementHandler(async (request: NextRequest) => {
  const g = await assertProcurement(request, 'READ')
  const myRole = String((g.session as any)?.role || '').toUpperCase()
  const myTier = g.tier

  const commonWhere = `
    a."organizationId" = $1
    AND a.status = 'PENDING'
    AND (
      a."approverUserId" = $2
      OR a."delegatedTo" = $2
      OR UPPER(COALESCE(a."approverRole", '')) = $3
      OR ($4 >= 3 AND a."approverUserId" IS NULL)
    )
  `

  const [pendingRes, overdueRes] = await Promise.all([
    pool.query(
      `SELECT COUNT(*)::int AS n FROM "PurchaseRequisitionApproval" a WHERE ${commonWhere}`,
      [g.organizationId, g.userId, myRole, myTier]
    ),
    pool.query(
      `SELECT COUNT(*)::int AS n FROM "PurchaseRequisitionApproval" a
       WHERE ${commonWhere} AND a."dueAt" IS NOT NULL AND a."dueAt" < NOW()`,
      [g.organizationId, g.userId, myRole, myTier]
    ),
  ])

  // Decisions I made today
  const todayRes = await pool.query(
    `SELECT
       COUNT(*) FILTER (WHERE status = 'APPROVED')::int  AS approved_today,
       COUNT(*) FILTER (WHERE status = 'REJECTED')::int  AS rejected_today
     FROM "PurchaseRequisitionApproval"
     WHERE "organizationId" = $1
       AND ("approverUserId" = $2 OR "delegatedTo" = $2)
       AND "decidedAt" >= NOW() - INTERVAL '24 hours'`,
    [g.organizationId, g.userId]
  )

  // Requisitions awaiting my org's approvals
  const awaitingRes = await pool.query(
    `SELECT COUNT(*)::int AS n FROM "PurchaseRequisition"
     WHERE "organizationId" = $1 AND status = 'SUBMITTED'`,
    [g.organizationId]
  )

  const monthRes = await pool.query(
    `SELECT COUNT(*)::int AS n FROM "PurchaseRequisition"
     WHERE "organizationId" = $1
       AND status = 'APPROVED'
       AND "approvedAt" >= DATE_TRUNC('month', NOW())`,
    [g.organizationId]
  )

  return NextResponse.json({
    pending: pendingRes.rows[0]?.n || 0,
    overdue: overdueRes.rows[0]?.n || 0,
    approvedToday: todayRes.rows[0]?.approved_today || 0,
    rejectedToday: todayRes.rows[0]?.rejected_today || 0,
    totalRequisitionsAwaiting: awaitingRes.rows[0]?.n || 0,
    totalRequisitionsApprovedThisMonth: monthRes.rows[0]?.n || 0,
  })
})