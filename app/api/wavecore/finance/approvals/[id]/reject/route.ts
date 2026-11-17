export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'
import { writeAudit } from '@/lib/wavecore/audit'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const client = await pool.connect()
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json().catch(() => ({}))
    const reason = (body.reason || '').trim() || 'No reason provided'

    const approvalRes = await client.query(
      `SELECT * FROM "FinanceApproval"
       WHERE id = $1 AND "organizationId" = $2 LIMIT 1`,
      [params.id, session.organizationId]
    )
    if (approvalRes.rowCount === 0) {
      return NextResponse.json({ error: 'Approval not found' }, { status: 404 })
    }
    const approval = approvalRes.rows[0]
    if (approval.status !== 'PENDING') {
      return NextResponse.json({ error: 'Approval is not pending (current: ' + approval.status + ')' }, { status: 409 })
    }

    await client.query('BEGIN')

    // Update source entity to REJECTED
    if (approval.documentType === 'INVOICE') {
      await client.query(
        `UPDATE "CustomerInvoice"
         SET status = 'REJECTED', "rejectionReason" = $1, "updatedAt" = NOW()
         WHERE id = $2 AND "organizationId" = $3`,
        [reason, approval.documentId, session.organizationId]
      )
    } else if (approval.documentType === 'JOURNAL_ENTRY') {
      await client.query(
        `UPDATE "JournalEntry"
         SET status = 'REJECTED', "rejectionReason" = $1, "updatedAt" = NOW()
         WHERE id = $2 AND "organizationId" = $3`,
        [reason, approval.documentId, session.organizationId]
      )
    } else if (approval.documentType === 'PAYMENT') {
      // Payment has no status column — just delete it (no GL was posted)
      await client.query(
        `DELETE FROM "CustomerPayment"
         WHERE id = $1 AND "organizationId" = $2`,
        [approval.documentId, session.organizationId]
      )
    }

    // Mark approval REJECTED
    await client.query(
      `UPDATE "FinanceApproval"
       SET status = 'REJECTED',
           "decidedBy" = $1,
           "decidedByName" = $2,
           "decidedAt" = NOW(),
           "rejectionReason" = $3,
           "updatedAt" = NOW()
       WHERE id = $4 AND "organizationId" = $5`,
      [session.userId, session.name || 'User', reason, params.id, session.organizationId]
    )

    await writeAudit(client, {
      organizationId: session.organizationId,
      userId: session.userId,
      action: 'REJECT',
      entityType: 'FinanceApproval',
      entityId: params.id,
      changes: { documentType: approval.documentType, documentNumber: approval.documentNumber, reason },
    })

    await client.query('COMMIT')

    return NextResponse.json({
      success: true,
      approvalId: params.id,
      status: 'REJECTED',
    })
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {})
    console.error('[finance/approvals/reject]', error)
    return NextResponse.json({ error: 'Failed: ' + (error as Error).message }, { status: 500 })
  } finally {
    client.release()
  }
}