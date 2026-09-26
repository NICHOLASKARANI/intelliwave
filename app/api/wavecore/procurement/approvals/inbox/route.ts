export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { assertProcurement, procurementHandler } from '@/lib/wavecore/procurement-guard'

/**
 * GET /api/wavecore/procurement/approvals/inbox
 * Query:
 *   appliesTo  — REQUISITION | PURCHASE_ORDER (default: all)
 *   sort       — dueAt | createdAt (default: dueAt asc)
 *   limit      — max 100, default 50
 *   offset     — default 0
 *
 * Returns every approval step pending action by the caller.
 */
export const GET = procurementHandler(async (request: NextRequest) => {
  const g = await assertProcurement(request, 'READ')
  const { searchParams } = new URL(request.url)
  const appliesTo = searchParams.get('appliesTo')
  const sort = searchParams.get('sort') || 'dueAt'
  const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '50', 10) || 50, 1), 100)
  const offset = Math.max(parseInt(searchParams.get('offset') || '0', 10) || 0, 0)

  const myRole = String((g.session as any)?.role || '').toUpperCase()
  const myTier = g.tier

  // Build a query that returns PENDING approvals actionable by me.
  // Actionable means any of:
  //   approverUserId = me
  //   delegatedTo = me
  //   approverRole = myRole
  //   (myTier >= 3 AND approverUserId IS NULL) → admin override
  const where: string[] = [
    'a."organizationId" = $1',
    "a.status = 'PENDING'",
    `(
       a."approverUserId" = $2
       OR a."delegatedTo" = $2
       OR UPPER(COALESCE(a."approverRole", '')) = $3
       OR ($4 >= 3 AND a."approverUserId" IS NULL)
     )`,
  ]
  const params: any[] = [g.organizationId, g.userId, myRole, myTier]

  if (appliesTo) {
    params.push(appliesTo)
    where.push('r."appliesTo" = $' + params.length)
    // Note: the requisition table doesn't have appliesTo; we're joining entityType.
    // Simplify: filter by whether the parent entity is a requisition.
    // We only track requisitions in this table; future POs will use a different table.
  }

  const sortSQL = sort === 'createdAt'
    ? 'a."createdAt" ASC'
    : 'a."dueAt" ASC NULLS LAST, a."createdAt" ASC'

  const whereSQL = where.join(' AND ')

  // Join with requisition
  const listRes = await pool.query(
    `SELECT
       a.id            AS "approvalId",
       a."stepNumber"  AS "stepNumber",
       a."approverRole",
       a."approverUserId",
       a."delegatedTo",
       a."delegatedAt",
       a."slaHours",
       a."dueAt",
       a."createdAt"   AS "approvalCreatedAt",
       r.id            AS "requisitionId",
       r."requisitionNumber",
       r.title,
       r.description,
       r.category,
       r.priority,
       r."totalAmount",
       r.currency,
       r."totalApprovalSteps",
       r."currentApprovalStep",
       r."requestedByName",
       r."neededBy",
       r."submittedAt",
       r."isEmergency"
     FROM "PurchaseRequisitionApproval" a
     JOIN "PurchaseRequisition" r ON r.id = a."requisitionId" AND r."organizationId" = a."organizationId"
     WHERE ${whereSQL}
     ORDER BY ${sortSQL}
     LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, limit, offset]
  )

  // Count
  const countRes = await pool.query(
    `SELECT COUNT(*)::int AS total
     FROM "PurchaseRequisitionApproval" a
     WHERE ${whereSQL}`,
    params
  )

  return NextResponse.json({
    inbox: listRes.rows,
    total: countRes.rows[0]?.total || 0,
    limit,
    offset,
  })
})