export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'
import { postInvoiceToGL, postPaymentToGL } from '@/lib/wavecore/finance/post-journal'
import { writeAudit } from '@/lib/wavecore/audit'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const client = await pool.connect()
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Look up the approval
    const approvalRes = await client.query(
      `SELECT * FROM "FinanceApproval"
       WHERE id = $1 AND "organizationId" = $2
       LIMIT 1`,
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

    let posted: any = null

    if (approval.documentType === 'INVOICE') {
      const invRes = await client.query(
        `SELECT * FROM "CustomerInvoice"
         WHERE id = $1 AND "organizationId" = $2
         LIMIT 1`,
        [approval.documentId, session.organizationId]
      )
      if (invRes.rowCount === 0) throw new Error('Invoice not found')
      const inv = invRes.rows[0]

      // Post to GL if not already posted (checks existing JE for this invoice)
      const existingJe = await client.query(
        `SELECT id FROM "JournalEntry"
         WHERE "organizationId" = $1 AND description LIKE $2
         LIMIT 1`,
        [session.organizationId, `%[INVOICE:${String(inv.id).slice(0, 8)}]%`]
      )
      if (existingJe.rowCount === 0) {
        await postInvoiceToGL(client, {
          organizationId: session.organizationId,
          invoiceId: inv.id,
          invoiceNumber: inv.number,
          date: inv.date,
          subtotal: Number(inv.subtotal),
          taxAmount: Number(inv.taxAmount),
          total: Number(inv.total),
        })
      }

      // Set invoice to SENT (or preserve current status if it was already PAID etc)
      const newStatus = inv.status === 'PAID' || inv.status === 'PARTIALLY_PAID' ? inv.status : 'SENT'
      await client.query(
        `UPDATE "CustomerInvoice" SET status = $1, "updatedAt" = NOW()
         WHERE id = $2 AND "organizationId" = $3`,
        [newStatus, inv.id, session.organizationId]
      )
      posted = { invoiceId: inv.id, newStatus }
    } else if (approval.documentType === 'PAYMENT') {
      const pmtRes = await client.query(
        `SELECT * FROM "CustomerPayment"
         WHERE id = $1 AND "organizationId" = $2
         LIMIT 1`,
        [approval.documentId, session.organizationId]
      )
      if (pmtRes.rowCount === 0) throw new Error('Payment not found')
      const pmt = pmtRes.rows[0]

      await postPaymentToGL(client, {
        organizationId: session.organizationId,
        paymentId: pmt.id,
        reference: pmt.number || pmt.id,
        date: pmt.date || new Date().toISOString(),
        amount: Number(pmt.amount),
      })

      // Update linked invoice status
      if (pmt.invoiceId) {
        const invSum = await client.query(
          `SELECT "total", (SELECT COALESCE(SUM(amount),0) FROM "CustomerPayment" WHERE "invoiceId" = $1) AS paid
           FROM "CustomerInvoice" WHERE id = $1`,
          [pmt.invoiceId]
        )
        if (invSum.rowCount > 0) {
          const tot = Number(invSum.rows[0].total)
          const paid = Number(invSum.rows[0].paid)
          const newStatus = paid >= tot - 0.01 ? 'PAID' : 'PARTIALLY_PAID'
          await client.query(
            `UPDATE "CustomerInvoice" SET status = $1, "updatedAt" = NOW()
             WHERE id = $2 AND "organizationId" = $3`,
            [newStatus, pmt.invoiceId, session.organizationId]
          )
        }
      }
      posted = { paymentId: pmt.id }
    } else if (approval.documentType === 'JOURNAL_ENTRY') {
      // Journal items already exist from the create step; just flip status to POSTED
      await client.query(
        `UPDATE "JournalEntry" SET status = 'POSTED', "updatedAt" = NOW()
         WHERE id = $1 AND "organizationId" = $2`,
        [approval.documentId, session.organizationId]
      )
      posted = { journalEntryId: approval.documentId }
    }

    // Mark approval as APPROVED
    await client.query(
      `UPDATE "FinanceApproval"
       SET status = 'APPROVED',
           "decidedBy" = $1,
           "decidedByName" = $2,
           "decidedAt" = NOW(),
           "updatedAt" = NOW()
       WHERE id = $3 AND "organizationId" = $4`,
      [session.userId, session.name || 'User', params.id, session.organizationId]
    )

    // Audit
    await writeAudit(client, {
      organizationId: session.organizationId,
      userId: session.userId,
      action: 'APPROVE',
      entityType: 'FinanceApproval',
      entityId: params.id,
      changes: { documentType: approval.documentType, documentNumber: approval.documentNumber, posted },
    })

    await client.query('COMMIT')

    return NextResponse.json({
      success: true,
      approvalId: params.id,
      status: 'APPROVED',
      posted,
    })
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {})
    console.error('[finance/approvals/approve]', error)
    return NextResponse.json({ error: 'Failed: ' + (error as Error).message }, { status: 500 })
  } finally {
    client.release()
  }
}