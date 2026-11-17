export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/wavecore/auth'
import { pool } from '@/lib/wavecore/db'
import { postPaymentToGL } from '@/lib/wavecore/finance/post-journal'
import { writeAudit, writeAuditAsync } from '@/lib/wavecore/audit'
import { evaluateFinanceApproval, createFinanceApprovalRequest } from '@/lib/wavecore/finance/finance-approval'

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const result = await pool.query(
      `SELECT cp.*, ci.number as "invoiceNumber", c.name as "customerName"
       FROM "CustomerPayment" cp
       LEFT JOIN "CustomerInvoice" ci ON cp."invoiceId" = ci.id
       LEFT JOIN "Customer" c ON ci."customerId" = c.id
       WHERE cp."organizationId" = $1
       ORDER BY cp."createdAt" DESC LIMIT 100`,
      [session.organizationId]
    )

    const payments = result.rows
    const totalReceived = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0)

    return NextResponse.json({ payments, totalReceived, count: payments.length })
  } catch (error) {
    console.error('Payments GET error:', error)
    return NextResponse.json({ payments: [], totalReceived: 0, count: 0 })
  }
}

export async function POST(request: NextRequest) {
  const client = await pool.connect()
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const amount = Number(body.amount) || 0
    if (amount <= 0) return NextResponse.json({ error: 'Amount must be positive' }, { status: 400 })

    const invoiceId = body.invoiceId || null
    if (!invoiceId) return NextResponse.json({ error: 'Invoice is required' }, { status: 400 })

    // Verify the invoice belongs to this tenant
    const invCheck = await pool.query(
      `SELECT id, number, total,
              COALESCE((SELECT SUM(amount) FROM "CustomerPayment" WHERE "invoiceId" = $1), 0) AS "alreadyPaid"
       FROM "CustomerInvoice"
       WHERE id = $1 AND "organizationId" = $2`,
      [invoiceId, session.organizationId]
    )
    if (invCheck.rowCount === 0) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    const invoice = invCheck.rows[0]
    const invoiceTotal = Number(invoice.total)
    const alreadyPaid = Number(invoice.alreadyPaid || 0)
    const remaining = invoiceTotal - alreadyPaid

    if (amount > remaining + 0.01) {
      return NextResponse.json({ error: `Overpayment: remaining balance is ${remaining.toFixed(2)}` }, { status: 400 })
    }

    const crypto = require('crypto')
    const id = crypto.randomUUID()
    const number = 'PAY-' + Date.now().toString().slice(-8)
    const dateStr = body.date || new Date().toISOString().split('T')[0]

      // ── Approval check (finance-only, isolated to FinanceApproval table) ──
      const approvalDecision = await evaluateFinanceApproval(
        session.organizationId,
        'PAYMENT',
        amount
      )

      await client.query('BEGIN')

      let approvalId: string | null = null

      if (approvalDecision.requiresApproval) {
        const paymentRow = await client.query(
          `INSERT INTO "CustomerPayment"
             (id, "number", amount, method, "invoiceId", "organizationId", date, reference, "createdAt")
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW()) RETURNING *`,
          [id, number, amount, body.method || 'MPESA', invoiceId, session.organizationId, dateStr, body.reference || null]
        )

        const approval = await createFinanceApprovalRequest(client, {
          organizationId: session.organizationId,
          documentType: 'PAYMENT',
          entityId: id,
          entityNumber: number,
          amount,
          userId: session.userId,
          userName: session.name || 'User',
          chainId: approvalDecision.chainId,
        })
        approvalId = approval.approvalId

        await writeAudit(client, {
          organizationId: session.organizationId,
          userId: session.userId,
          action: 'CREATE',
          entityType: 'CustomerPayment',
          entityId: id,
          changes: { number, amount, method: body.method || 'MPESA', invoiceId, status: 'PENDING_APPROVAL', approvalId },
        })

        await client.query('COMMIT')

        return NextResponse.json({
          payment: paymentRow.rows[0],
          requiresApproval: true,
          approvalId,
          chainName: approvalDecision.chainName,
        }, { status: 201 })
      }

      // Under threshold — existing behavior preserved
      const result = await client.query(
        `INSERT INTO "CustomerPayment"
           (id, "number", amount, method, "invoiceId", "organizationId", date, reference, "createdAt")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW()) RETURNING *`,
        [id, number, amount, body.method || 'MPESA', invoiceId, session.organizationId, dateStr, body.reference || null]
      )

      await postPaymentToGL(client, {
        organizationId: session.organizationId,
        paymentId: id,
        reference: number,
        date: dateStr,
        amount,
      })

      const newPaid = alreadyPaid + amount
      const newStatus = newPaid >= invoiceTotal - 0.01 ? 'PAID' : 'PARTIALLY_PAID'
      await client.query(
        `UPDATE "CustomerInvoice" SET status = $1, "updatedAt" = NOW()
         WHERE id = $2 AND "organizationId" = $3`,
        [newStatus, invoiceId, session.organizationId]
      )

      await writeAudit(client, {
        organizationId: session.organizationId,
        userId: session.userId,
        action: 'CREATE',
        entityType: 'CustomerPayment',
        entityId: id,
        changes: { number, amount, method: body.method || 'MPESA', invoiceId, newInvoiceStatus: newStatus, reference: body.reference || null },
      })

      await client.query('COMMIT')

      return NextResponse.json({
        payment: result.rows[0],
        newInvoiceStatus: newStatus,
        requiresApproval: false,
        approvalId: null,
        chainName: null,
      }, { status: 201 })
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {})
    console.error('Payment create error:', error)
    return NextResponse.json({ error: 'Create failed: ' + (error as Error).message }, { status: 500 })
  } finally {
    client.release()
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const delResult = await pool.query(`DELETE FROM "CustomerPayment" WHERE id = $1 AND "organizationId" = $2`, [id, session.organizationId])
    if (delResult.rowCount && delResult.rowCount > 0) {
      await writeAuditAsync({
        organizationId: session.organizationId,
        userId: session.userId,
        action: 'DELETE',
        entityType: 'CustomerPayment',
        entityId: id || '',
      })
    }
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
  }
}
