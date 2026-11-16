import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const session = await requireTenant(req)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const url = new URL(req.url)
    const pendingId = url.searchParams.get('id')
    if (!pendingId) return NextResponse.json({ error: 'id required' }, { status: 400 })

    // ─── Tenant isolation: only this org's pending payments ───
    const result = await pool.query(
      `SELECT p.id, p.status, p."planId", p.amount, p."approvedAt", p."rejectionNote"
       FROM "PendingBankPayment" p
       JOIN "User" u ON u.id = p."userId"
       WHERE p.id = $1 AND u."organizationId" = $2
       LIMIT 1`,
      [pendingId, session.organizationId]
    )

    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const p = result.rows[0]

    // ─── Minimal response: no PII, no internal fields ───
    return NextResponse.json({
      pending: p.status === 'PENDING',
      approved: p.status === 'APPROVED',
      rejected: p.status === 'REJECTED',
      plan: p.planId,
      amount: p.amount,
      approvedAt: p.approvedAt,
      rejectionNote: p.rejectionNote,
    })
  } catch (err) {
    console.error('[bank-payment/status] error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}