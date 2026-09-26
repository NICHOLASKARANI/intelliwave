export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { assertProcurement, logProcurementEvent, procurementHandler } from '@/lib/wavecore/procurement-guard'
import { runThreeWayMatch } from '@/lib/wavecore/procurement-match'

/**
 * POST /api/wavecore/procurement/supplier-invoices/[id]/match
 * Runs the 3-way match (PO ↔ GRN ↔ Invoice) against current data and
 * persists per-line + invoice-level match status. Never mutates the
 * underlying amounts — only the match annotation columns.
 *
 * Allowed while invoice.status ∈ { DRAFT, SUBMITTED, MISMATCH, PARTIAL_MATCH }.
 * Refuses on APPROVED / PAID / CANCELLED (frozen).
 */
export const POST = procurementHandler(async (request: NextRequest, ctx: { params: { id: string } }) => {
  const g = await assertProcurement(request, 'WRITE')
  const id = ctx.params.id

  const invRes = await pool.query(
    `SELECT * FROM "SupplierInvoice" WHERE id = $1 AND "organizationId" = $2`,
    [id, g.organizationId]
  )
  if (invRes.rowCount === 0) {
    return NextResponse.json({ error: 'Supplier invoice not found' }, { status: 404 })
  }
  const invoice = invRes.rows[0]

  const frozen = ['APPROVED', 'PAID', 'CANCELLED']
  if (frozen.includes(invoice.status)) {
    return NextResponse.json({ error: 'Cannot rematch invoice in status ' + invoice.status }, { status: 409 })
  }

  // Fetch lines
  const invLinesRes = await pool.query(
    `SELECT * FROM "SupplierInvoiceLine"
     WHERE "supplierInvoiceId" = $1 AND "organizationId" = $2
     ORDER BY COALESCE("lineNumber", 9999) ASC`,
    [id, g.organizationId]
  )
  const invoiceLines = invLinesRes.rows
  if (invoiceLines.length === 0) {
    return NextResponse.json({ error: 'Invoice has no lines to match' }, { status: 400 })
  }

  // Collect PO item ids referenced by invoice lines
  const poItemIds = Array.from(new Set(
    invoiceLines.map((l: any) => l.purchaseOrderItemId).filter(Boolean)
  ))

  // Also include PO items from the linked PO (in case invoice line has no PO item ref)
  let poItems: any[] = []
  if (poItemIds.length > 0) {
    const r = await pool.query(
      `SELECT poi.* FROM "PurchaseOrderItem" poi
       JOIN "PurchaseOrder" po ON po.id = poi."purchaseOrderId"
       WHERE poi.id = ANY($1::text[]) AND po."organizationId" = $2`,
      [poItemIds, g.organizationId]
    )
    poItems = r.rows
  }
  if (invoice.purchaseOrderId) {
    const r = await pool.query(
      `SELECT poi.* FROM "PurchaseOrderItem" poi
       WHERE poi."purchaseOrderId" = $1`,
      [invoice.purchaseOrderId]
    )
    const seen = new Set(poItems.map(p => p.id))
    for (const row of r.rows) if (!seen.has(row.id)) poItems.push(row)
  }

  // Fetch GRN lines for those PO items within this org
  let grnLines: any[] = []
  if (poItemIds.length > 0) {
    const r = await pool.query(
      `SELECT * FROM "GoodsReceiptLine"
       WHERE "purchaseOrderItemId" = ANY($1::text[]) AND "organizationId" = $2`,
      [poItemIds, g.organizationId]
    )
    grnLines = r.rows
  }

  // Run match
  const result = runThreeWayMatch(poItems, grnLines, invoiceLines)

  // Persist per-line verdicts
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    for (const lm of result.perLine) {
      await client.query(
        `UPDATE "SupplierInvoiceLine"
         SET "matchedQty" = $1,
             "matchedAmount" = $2,
             "matchStatus" = $3,
             "matchNotes" = $4,
             "updatedAt" = NOW()
         WHERE id = $5 AND "supplierInvoiceId" = $6 AND "organizationId" = $7`,
        [
          lm.matchedQty,
          lm.matchedAmount,
          lm.verdict,
          lm.notes,
          lm.lineId, id, g.organizationId,
        ]
      )
    }

    // Roll up to invoice header
    const newMatchStatus = result.overall
    const newInvoiceStatus =
      result.overall === 'AUTO_MATCHED' ? 'MATCHED'
      : result.overall === 'PARTIAL'    ? 'PARTIAL_MATCH'
      : result.overall === 'EXCEPTION'  ? 'MISMATCH'
      : invoice.status  // leave as-is for UNMATCHED

    await client.query(
      `UPDATE "SupplierInvoice"
       SET "matchStatus" = $1, "matchNotes" = $2, status = $3, "updatedAt" = NOW()
       WHERE id = $4 AND "organizationId" = $5`,
      [newMatchStatus, result.summary, newInvoiceStatus, id, g.organizationId]
    )

    await client.query('COMMIT')
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('[invoice-match]', (err as Error).message)
    return NextResponse.json({ error: 'Match failed: ' + (err as Error).message }, { status: 500 })
  } finally {
    client.release()
  }

  await logProcurementEvent(pool, {
    organizationId: g.organizationId,
    eventType: 'SUPPLIER_INVOICE_MATCHED',
    entityType: 'SupplierInvoice',
    entityId: id,
    actorId: g.userId,
    actorName: g.userName,
    summary: result.summary,
    metadata: {
      overall: result.overall,
      matchedLines: result.perLine.filter(l => l.verdict === 'MATCHED').length,
      exceptionLines: result.perLine.filter(l => l.verdict === 'EXCEPTION').length,
      partialLines: result.perLine.filter(l => l.verdict === 'PARTIAL').length,
    },
  })

  return NextResponse.json({
    ok: true,
    overall: result.overall,
    summary: result.summary,
    perLine: result.perLine,
  })
})