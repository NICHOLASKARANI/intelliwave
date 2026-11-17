export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'
import { writeAudit } from '@/lib/wavecore/audit'
import { postCustomerCreditNoteToGL } from '@/lib/wavecore/finance/post-journal'

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const client = await pool.connect()
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const cnRes = await client.query(
      `SELECT * FROM "CustomerCreditNote" WHERE id = $1 AND "organizationId" = $2 LIMIT 1`,
      [params.id, session.organizationId]
    )
    if (cnRes.rowCount === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    const cn = cnRes.rows[0]
    if (!['DRAFT', 'PENDING_APPROVAL'].includes(cn.status)) {
      return NextResponse.json({ error: 'Cannot approve credit note in status ' + cn.status }, { status: 409 })
    }

    await client.query('BEGIN')

    await postCustomerCreditNoteToGL(client, {
      organizationId: session.organizationId,
      creditNoteId: cn.id,
      creditNoteNumber: cn.creditNoteNumber,
      date: cn.date,
      subtotal: Number(cn.subtotal || 0),
      taxAmount: Number(cn.taxAmount || 0),
      total: Number(cn.total || 0),
    })

    await client.query(
      `UPDATE "CustomerCreditNote"
       SET status = 'APPLIED', "approvedBy" = $1, "approvedAt" = NOW(),
           "appliedAt" = NOW(), "updatedAt" = NOW()
       WHERE id = $2 AND "organizationId" = $3`,
      [session.userId, params.id, session.organizationId]
    )

    // If linked to an invoice, mark it as adjusted (do not modify total — credit note is separate)
    if (cn.invoiceId) {
      await client.query(
        `UPDATE "CustomerInvoice" SET "updatedAt" = NOW()
         WHERE id = $1 AND "organizationId" = $2`,
        [cn.invoiceId, session.organizationId]
      )
    }

    // Mark linked FinanceApproval APPROVED if present
    if (cn.approvalId) {
      await client.query(
        `UPDATE "FinanceApproval"
         SET status = 'APPROVED', "decidedBy" = $1, "decidedByName" = $2,
             "decidedAt" = NOW(), "updatedAt" = NOW()
         WHERE id = $3 AND "organizationId" = $4`,
        [session.userId, session.name || 'User', cn.approvalId, session.organizationId]
      )
    }

    await writeAudit(client, {
      organizationId: session.organizationId,
      userId: session.userId,
      action: 'APPROVE',
      entityType: 'CustomerCreditNote',
      entityId: params.id,
      changes: { number: cn.creditNoteNumber, total: cn.total },
    })

    await client.query('COMMIT')

    return NextResponse.json({ success: true, creditNoteId: params.id, status: 'APPLIED' })
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {})
    console.error('[credit-notes/customer approve]', error)
    return NextResponse.json({ error: 'Approve failed: ' + (error as Error).message }, { status: 500 })
  } finally {
    client.release()
  }
}