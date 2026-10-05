export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

/**
 * PATCH /api/wavecore/finance/fiscal-periods/[id]
 * Body: { isClosed: boolean }
 * Close or reopen a period. Closing a period blocks new POSTED journal
 * entries in that date range. Read the entry-count first so the user
 * knows what they are locking.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const orgId = session.organizationId

    const body = await request.json().catch(() => null)
    if (!body || typeof body.isClosed !== 'boolean') {
      return NextResponse.json({ error: 'isClosed must be a boolean' }, { status: 400 })
    }

    // Verify period belongs to a fiscal year owned by this org
    const found = await pool.query(
      `SELECT p.id, p.name FROM "FiscalPeriod" p
       JOIN "FiscalYear" y ON y.id = p."fiscalYearId"
       WHERE p.id = $1 AND y."organizationId" = $2`,
      [params.id, orgId]
    )
    if (found.rowCount === 0) return NextResponse.json({ error: 'Period not found' }, { status: 404 })

    const upd = await pool.query(
      `UPDATE "FiscalPeriod" SET "isClosed" = $1 WHERE id = $2 RETURNING *`,
      [body.isClosed, params.id]
    )

    return NextResponse.json({ period: upd.rows[0] })
  } catch (error) {
    console.error('[fiscal-period PATCH]', error)
    return NextResponse.json({ error: 'Failed to update period' }, { status: 500 })
  }
}