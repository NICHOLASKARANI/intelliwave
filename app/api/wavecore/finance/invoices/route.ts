export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/wavecore/auth'
import { pool } from '@/lib/wavecore/db'
import { ensureInvoiceSchema } from '@/lib/wavecore/invoice-schema'
import { postInvoiceToGL } from '@/lib/wavecore/finance/post-journal'
import { writeAudit, writeAuditAsync } from '@/lib/wavecore/audit'
import { evaluateFinanceApproval, createFinanceApprovalRequest } from '@/lib/wavecore/finance/finance-approval'

// GET: List all invoices with customer info
export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    await ensureInvoiceSchema()

    const result = await pool.query(
      `SELECT ci.*, c.name as "customerName", c.email as "customerEmail", c.phone as "customerPhone",
        (SELECT COALESCE(SUM(cp.amount), 0) FROM "CustomerPayment" cp WHERE cp."invoiceId" = ci.id) as "paidAmount"
       FROM "CustomerInvoice" ci
       LEFT JOIN "Customer" c ON ci."customerId" = c.id
       WHERE ci."organizationId" = $1 
       ORDER BY ci."createdAt" DESC LIMIT 100`,
      [session.organizationId]
    )

    // Calculate totals
    const invoices = result.rows
    const totalInvoiced = invoices.reduce((sum, inv) => sum + parseFloat(inv.total || 0), 0)
    const totalPaid = invoices.reduce((sum, inv) => sum + parseFloat(inv.paidAmount || 0), 0)
    const totalOutstanding = totalInvoiced - totalPaid

    // Attach line items to each invoice (single query, grouped in JS)
    const itemsByInvoice = new Map<string, any[]>()
    if (invoices.length > 0) {
      try {
        const ids = invoices.map((inv: any) => inv.id)
        const itemsResult = await pool.query(
          'SELECT id, "invoiceId", description, quantity, "unitPrice", total FROM "InvoiceItem" WHERE "invoiceId" = ANY($1) ORDER BY "createdAt"',
          [ids]
        )
        for (const item of itemsResult.rows) {
          const arr = itemsByInvoice.get(item.invoiceId) || []
          arr.push(item)
          itemsByInvoice.set(item.invoiceId, arr)
        }
      } catch (e) {
        console.warn('[invoices GET] failed to load items:', (e as Error).message)
      }
    }

    const invoicesWithItems = invoices.map((inv: any) => ({
      ...inv,
      items: itemsByInvoice.get(inv.id) || [],
    }))

    return NextResponse.json({
      invoices: invoicesWithItems,
      totalInvoiced,
      totalPaid,
      totalOutstanding,
      count: invoicesWithItems.length
    })
  } catch (error) {
    console.error('Invoices GET error:', error)
    return NextResponse.json({ invoices: [], totalInvoiced: 0, totalPaid: 0, totalOutstanding: 0, count: 0 })
  }
}

// POST: Create invoice with items
export async function POST(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    await ensureInvoiceSchema()

    const body = await request.json()
    const crypto = require('crypto')
    const invoiceId = crypto.randomUUID()
    const invoiceNumber = 'INV-' + Date.now().toString().slice(-8)

    // Calculate totals from items
    const items = body.items || []
    let subtotal = 0
    for (const item of items) {
      subtotal += (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0)
    }
    const taxRate = body.taxRate || 0.16 // Default 16% VAT
    const taxAmount = subtotal * taxRate
    const total = subtotal + taxAmount
    // FX: default to KES at rate 1 -- preserves pre-FX behavior for existing callers.
    const currency = (typeof body.currency === 'string' && body.currency.trim()) || 'KES'
    const fxRate = (body.fxRate === undefined || body.fxRate === null) ? 1 : Number(body.fxRate)
    if (!Number.isFinite(fxRate) || fxRate <= 0) {
      throw new Error('Invalid fxRate: ' + body.fxRate)
    }
    const baseAmount = Math.round(total * fxRate * 100) / 100

    // Get customerId
    let customerId = body.customerId

    // Insert invoice + items in a single transaction.
    // Either the whole invoice saves, or nothing does.
    const client = await pool.connect()
    try {
      // ── Approval check (finance-only, isolated to FinanceApproval table) ──
      const approvalDecision = await evaluateFinanceApproval(
        session.organizationId,
        'INVOICE',
        total
      )

      await client.query('BEGIN')

      let effectiveStatus: string = body.status || 'DRAFT'
      let approvalId: string | null = null

      if (approvalDecision.requiresApproval) {
        effectiveStatus = 'PENDING_APPROVAL'
        const approval = await createFinanceApprovalRequest(client, {
          organizationId: session.organizationId,
          documentType: 'INVOICE',
          entityId: invoiceId,
          entityNumber: invoiceNumber,
          amount: total,
          userId: session.userId,
          userName: session.name || 'User',
          chainId: approvalDecision.chainId,
        })
        approvalId = approval.approvalId
      }

      const result = await client.query(
        `INSERT INTO "CustomerInvoice"
           (id, number, date, "dueDate", status, subtotal, "taxAmount", total,
            "customerId", "organizationId", "requiresApproval", "approvalId",
            "createdAt", "updatedAt", currency, "fxRate", "baseAmount")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW(), NOW()) RETURNING *`,
        [
          invoiceId,
          invoiceNumber,
          body.date || new Date().toISOString().split('T')[0],
          body.dueDate || body.date || new Date().toISOString().split('T')[0],
          effectiveStatus,
          subtotal,
          taxAmount,
          total,
          customerId,
          session.organizationId,
          approvalDecision.requiresApproval,
          approvalId,
          currency,
          fxRate,
          baseAmount,
        ]
      )

      const savedItems: any[] = []
      for (const item of items) {
        const itemId = crypto.randomUUID()
        const itemTotal = (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0)
        const itemRow = await client.query(
          `INSERT INTO "InvoiceItem" (id, "invoiceId", description, quantity, "unitPrice", total, "organizationId")
           VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
          [
            itemId,
            invoiceId,
            item.description,
            Number(item.quantity) || 0,
            Number(item.unitPrice) || 0,
            itemTotal,
            session.organizationId,
          ]
        )
        savedItems.push(itemRow.rows[0])
      }

      if (!approvalDecision.requiresApproval) {
        await postInvoiceToGL(client, {
          organizationId: session.organizationId,
          invoiceId,
          invoiceNumber,
          date: body.date || new Date().toISOString().split('T')[0],
          subtotal,
          taxAmount,
          total,
          currency,
          fxRate,
        })
      }

      await writeAudit(client, {
        organizationId: session.organizationId,
        userId: session.userId,
        action: 'CREATE',
        entityType: 'CustomerInvoice',
        entityId: invoiceId,
        changes: {
          number: invoiceNumber, subtotal, taxAmount, total, customerId,
          status: effectiveStatus,
          requiresApproval: approvalDecision.requiresApproval,
          approvalId,
        },
      })

      await client.query('COMMIT')

      const invoice = result.rows[0]
      return NextResponse.json({
        invoice: {
          ...invoice,
          subtotal,
          taxAmount,
          total,
          items: savedItems
        },
        requiresApproval: approvalDecision.requiresApproval,
        approvalId,
        chainName: approvalDecision.chainName,
      }, { status: 201 })
    } catch (err) {
      await client.query('ROLLBACK').catch(() => {})
      throw err
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('Invoice create error:', error)
    return NextResponse.json({ error: 'Create failed: ' + (error as Error).message }, { status: 500 })
  }
}

// PUT: Update invoice status
export async function PUT(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    await ensureInvoiceSchema()

    const body = await request.json()
      const result = await pool.query(
      `UPDATE "CustomerInvoice" SET status = $1, "updatedAt" = NOW() WHERE id = $2 AND "organizationId" = $3 RETURNING *`,
      [body.status, body.id, session.organizationId]
    )
    if (result.rowCount && result.rowCount > 0) {
      await writeAuditAsync({
        organizationId: session.organizationId,
        userId: session.userId,
        action: 'UPDATE',
        entityType: 'CustomerInvoice',
        entityId: body.id,
        changes: { status: body.status },
      })
    }
    return NextResponse.json({ invoice: result.rows[0] })
  } catch (error) {
    return NextResponse.json({ error: 'Update failed: ' + (error as Error).message }, { status: 500 })
  }
}

// DELETE: Delete invoice
export async function DELETE(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    await ensureInvoiceSchema()

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const delResult = await pool.query(`DELETE FROM "CustomerInvoice" WHERE id = $1 AND "organizationId" = $2`, [id, session.organizationId])
    if (delResult.rowCount && delResult.rowCount > 0) {
      await writeAuditAsync({
        organizationId: session.organizationId,
        userId: session.userId,
        action: 'DELETE',
        entityType: 'CustomerInvoice',
        entityId: id || '',
      })
    }
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Delete failed: ' + (error as Error).message }, { status: 500 })
  }
}

// PATCH: Update invoice details
export async function PATCH(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    await ensureInvoiceSchema()

    const body = await request.json()
      const result = await pool.query(
      `UPDATE "CustomerInvoice" SET "dueDate" = $1, status = $2, "updatedAt" = NOW() WHERE id = $3 AND "organizationId" = $4 RETURNING *`,
      [body.dueDate || null, body.status || 'DRAFT', body.id, session.organizationId]
    )
    if (result.rowCount && result.rowCount > 0) {
      await writeAuditAsync({
        organizationId: session.organizationId,
        userId: session.userId,
        action: 'UPDATE',
        entityType: 'CustomerInvoice',
        entityId: body.id,
        changes: { dueDate: body.dueDate || null, status: body.status || 'DRAFT' },
      })
    }
    return NextResponse.json({ invoice: result.rows[0] })
  } catch (error) {
    return NextResponse.json({ error: 'Update failed' }, { status: 500 })
  }
}
