export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'
import { writeAudit } from '@/lib/wavecore/audit'
import { evaluateFinanceApproval, createFinanceApprovalRequest } from '@/lib/wavecore/finance/finance-approval'

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const result = await pool.query(
      `SELECT * FROM "SupplierCreditNote"
       WHERE "organizationId" = $1
       ORDER BY "createdAt" DESC LIMIT 200`,
      [session.organizationId]
    )

    return NextResponse.json({ creditNotes: result.rows })
  } catch (error) {
    console.error('[credit-notes/supplier GET]', error)
    return NextResponse.json({ creditNotes: [], error: 'Failed to load' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const client = await pool.connect()
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const subtotal = Number(body.subtotal) || 0
    const taxAmount = Number(body.taxAmount) || 0
    const total = Number(body.total) || (subtotal + taxAmount)

    if (total <= 0) return NextResponse.json({ error: 'Total must be positive' }, { status: 400 })

    const crypto = require('crypto')
    const id = crypto.randomUUID()
    const number = 'SCN-' + Date.now().toString().slice(-8)

    const approvalDecision = await evaluateFinanceApproval(
      session.organizationId,
      'SUPPLIER_CREDIT_NOTE',
      total
    )

    await client.query('BEGIN')

    let effectiveStatus: string = 'DRAFT'
    let approvalId: string | null = null

    if (approvalDecision.requiresApproval) {
      effectiveStatus = 'PENDING_APPROVAL'
      const approval = await createFinanceApprovalRequest(client, {
        organizationId: session.organizationId,
        documentType: 'SUPPLIER_CREDIT_NOTE' as any,
        entityId: id,
        entityNumber: number,
        amount: total,
        userId: session.userId,
        userName: session.name || 'User',
        chainId: approvalDecision.chainId,
      })
      approvalId = approval.approvalId
    }

    const result = await client.query(
      `INSERT INTO "SupplierCreditNote"
         (id, "organizationId", "creditNoteNumber", "supplierInvoiceId", "supplierId",
          "supplierName", date, reason, subtotal, "taxAmount", total, status,
          "requiresApproval", "approvalId", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW(), NOW())
       RETURNING *`,
      [
        id, session.organizationId, number,
        body.supplierInvoiceId || null, body.supplierId || null, body.supplierName || null,
        body.date || new Date().toISOString().split('T')[0],
        body.reason || null, subtotal, taxAmount, total,
        effectiveStatus, approvalDecision.requiresApproval, approvalId,
      ]
    )

    await writeAudit(client, {
      organizationId: session.organizationId,
      userId: session.userId,
      action: 'CREATE',
      entityType: 'SupplierCreditNote',
      entityId: id,
      changes: { number, subtotal, taxAmount, total, status: effectiveStatus, requiresApproval: approvalDecision.requiresApproval, approvalId },
    })

    await client.query('COMMIT')

    return NextResponse.json({
      creditNote: result.rows[0],
      requiresApproval: approvalDecision.requiresApproval,
      approvalId,
      chainName: approvalDecision.chainName,
    }, { status: 201 })
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {})
    console.error('[credit-notes/supplier POST]', error)
    return NextResponse.json({ error: 'Create failed: ' + (error as Error).message }, { status: 500 })
  } finally {
    client.release()
  }
}