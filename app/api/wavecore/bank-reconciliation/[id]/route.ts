export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

/**
 * GET /api/wavecore/bank-reconciliation/[id]
 * Returns a single reconciliation header, tenant-isolated.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const result = await pool.query(
      `SELECT br.*,
              br."bookBalance" AS "closingBalance",
              ba.name AS "bankName",
              ba."accountNumber"
       FROM "BankReconciliation" br
       LEFT JOIN "BankAccount" ba ON ba.id = br."bankAccountId"
       WHERE br.id = $1 AND br."organizationId" = $2
       LIMIT 1`,
      [params.id, session.organizationId]
    )

    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'Reconciliation not found' }, { status: 404 })
    }

    return NextResponse.json({ reconciliation: result.rows[0] })
  } catch (error) {
    console.error('[bank-reconciliation/[id] GET]', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

/**
 * DELETE /api/wavecore/bank-reconciliation/[id]
 * Deletes a reconciliation (only if status is DRAFT).
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Only allow deleting drafts
    const check = await pool.query(
      `SELECT status FROM "BankReconciliation" WHERE id = $1 AND "organizationId" = $2`,
      [params.id, session.organizationId]
    )
    if (check.rowCount === 0) {
      return NextResponse.json({ error: 'Reconciliation not found' }, { status: 404 })
    }
    if (check.rows[0].status !== 'DRAFT') {
      return NextResponse.json({ error: 'Can only delete DRAFT reconciliations' }, { status: 400 })
    }

    await pool.query(
      `DELETE FROM "BankReconciliation" WHERE id = $1 AND "organizationId" = $2`,
      [params.id, session.organizationId]
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[bank-reconciliation/[id] DELETE]', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}