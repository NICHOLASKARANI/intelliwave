export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const statusFilter = (searchParams.get('status') || 'PENDING').toUpperCase()

    const result = await pool.query(
      `SELECT fa.id, fa."documentType", fa."documentId", fa."documentNumber",
              fa.amount, fa.status, fa."requestedBy", fa."requestedByName",
              fa."decidedBy", fa."decidedByName", fa."decidedAt", fa."rejectionReason",
              fa."createdAt", fa."updatedAt"
       FROM "FinanceApproval" fa
       WHERE fa."organizationId" = $1
         AND fa.status = $2
       ORDER BY fa."createdAt" DESC
       LIMIT 200`,
      [session.organizationId, statusFilter]
    )

    // Summary counts by status
    const counts = await pool.query(
      `SELECT status, COUNT(*)::int AS count
       FROM "FinanceApproval"
       WHERE "organizationId" = $1
       GROUP BY status`,
      [session.organizationId]
    )
    const countMap: Record<string, number> = { PENDING: 0, APPROVED: 0, REJECTED: 0 }
    for (const row of counts.rows) countMap[row.status] = row.count

    return NextResponse.json({
      approvals: result.rows,
      counts: countMap,
    })
  } catch (error) {
    console.error('[finance/approvals/inbox]', error)
    return NextResponse.json({ approvals: [], counts: {}, error: 'Failed to load' }, { status: 500 })
  }
}