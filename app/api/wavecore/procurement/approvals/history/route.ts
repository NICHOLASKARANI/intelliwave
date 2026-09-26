export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { assertProcurement, procurementHandler } from '@/lib/wavecore/procurement-guard'

/**
 * GET /api/wavecore/procurement/approvals/history
 * My decisions (approved/rejected) in the last 90 days.
 * Query: limit, offset, decision (APPROVED | REJECTED)
 */
export const GET = procurementHandler(async (request: NextRequest) => {
  const g = await assertProcurement(request, 'READ')
  const { searchParams } = new URL(request.url)
  const decision = searchParams.get('decision')
  const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '50', 10) || 50, 1), 100)
  const offset = Math.max(parseInt(searchParams.get('offset') || '0', 10) || 0, 0)

  const where: string[] = [
    'a."organizationId" = $1',
    'a."decidedAt" IS NOT NULL',
    'a."decidedAt" >= NOW() - INTERVAL \'90 days\'',
    '(a."approverUserId" = $2 OR a."delegatedTo" = $2)',
  ]
  const params: any[] = [g.organizationId, g.userId]

  if (decision && ['APPROVED', 'REJECTED'].includes(decision)) {
    params.push(decision)
    where.push('a.status = $' + params.length)
  }

  const whereSQL = where.join(' AND ')

  const listRes = await pool.query(
    `SELECT
       a.id, a."stepNumber", a.status, a.decision, a.comment,
       a."decidedAt", a."createdAt",
       r.id AS "requisitionId",
       r."requisitionNumber", r.title, r."totalAmount", r.currency,
       r."requestedByName"
     FROM "PurchaseRequisitionApproval" a
     JOIN "PurchaseRequisition" r ON r.id = a."requisitionId" AND r."organizationId" = a."organizationId"
     WHERE ${whereSQL}
     ORDER BY a."decidedAt" DESC
     LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, limit, offset]
  )

  const countRes = await pool.query(
    `SELECT COUNT(*)::int AS total FROM "PurchaseRequisitionApproval" a WHERE ${whereSQL}`,
    params
  )

  return NextResponse.json({
    history: listRes.rows,
    total: countRes.rows[0]?.total || 0,
    limit,
    offset,
  })
})