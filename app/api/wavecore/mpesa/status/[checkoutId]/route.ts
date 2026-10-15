export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

/**
 * GET /api/wavecore/mpesa/status/[checkoutId]
 * Returns the current status of an M-Pesa transaction.
 * Used by the payment UI to poll until the callback fires.
 */
export async function GET(req: NextRequest, ctx: { params: { checkoutId: string } }) {
  try {
    const session = await requireTenant(req)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const checkoutId = String(ctx.params.checkoutId || '')
    if (!checkoutId) return NextResponse.json({ error: 'checkoutId required' }, { status: 400 })

    const r = await pool.query(
      `SELECT id, purpose, amount, currency, "phoneNumber", status,
              "mpesaReceipt", "resultCode", "resultDescription",
              "checkoutRequestId", "createdAt", "updatedAt"
       FROM "MpesaTransaction"
       WHERE "checkoutRequestId" = $1 AND "organizationId" = $2
       LIMIT 1`,
      [checkoutId, session.organizationId]
    )

    if (r.rowCount === 0) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
    }

    const tx = r.rows[0]
    return NextResponse.json({
      status: tx.status,
      mpesaReceipt: tx.mpesaReceipt,
      resultCode: tx.resultCode,
      resultDescription: tx.resultDescription,
      amount: tx.amount,
      currency: tx.currency,
      phoneNumber: tx.phoneNumber,
      createdAt: tx.createdAt,
      updatedAt: tx.updatedAt,
      isPending: tx.status === 'STK_SENT',
      isSuccess: tx.status === 'SUCCESS',
      isFailed: tx.status === 'FAILED' || tx.status === 'STK_FAILED',
    })
  } catch (error) {
    console.error('[mpesa/status] unhandled:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}