export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { assertProcurement, logProcurementEvent, procurementHandler } from '@/lib/wavecore/procurement-guard'

/**
 * POST /api/wavecore/procurement/goods-receipts/[id]/submit
 *
 * Effects:
 * 1. Sets GRN status = SUBMITTED.
 * 2. For each GRN line: increments PurchaseOrderItem.receivedQty by
 *    acceptedQty (receivedQty - rejectedQty - damagedQty).
 * 3. Recomputes PO received totals → auto-advances PO status:
 *      - all lines fully received    → FULLY_RECEIVED
 *      - some but not all            → PARTIALLY_RECEIVED
 *      - (never downgrades beyond that)
 * 4. Auto-creates one QualityInspection (PENDING) per GRN line.
 * 5. Logs ProcurementEvent GOODS_RECEIPT_SUBMITTED.
 */
export const POST = procurementHandler(async (request: NextRequest, ctx: { params: { id: string } }) => {
  const g = await assertProcurement(request, 'WRITE')
  const id = ctx.params.id

  const grnRes = await pool.query(
    `SELECT * FROM "GoodsReceipt" WHERE id = $1 AND "organizationId" = $2`,
    [id, g.organizationId]
  )
  if (grnRes.rowCount === 0) {
    return NextResponse.json({ error: 'Goods receipt not found' }, { status: 404 })
  }
  const grn = grnRes.rows[0]
  if (grn.status !== 'DRAFT') {
    return NextResponse.json({ error: 'GRN already ' + grn.status }, { status: 409 })
  }

  const linesRes = await pool.query(
    `SELECT * FROM "GoodsReceiptLine"
     WHERE "goodsReceiptId" = $1 AND "organizationId" = $2`,
    [id, g.organizationId]
  )
  const lines = linesRes.rows
  if (lines.length === 0) {
    return NextResponse.json({ error: 'Cannot submit GRN with no lines' }, { status: 400 })
  }

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    // 1. Apply receivedQty to PO items
    for (const l of lines) {
      const acceptedQty = Math.max(0,
        Number(l.receivedQty || 0) - Number(l.rejectedQty || 0) - Number(l.damagedQty || 0)
      )
      if (acceptedQty <= 0) continue

      await client.query(
        `UPDATE "PurchaseOrderItem"
         SET "receivedQty" = COALESCE("receivedQty", 0) + $1
         WHERE id = $2 AND "purchaseOrderId" = $3`,
        [acceptedQty, l.purchaseOrderItemId, grn.purchaseOrderId]
      )
    }

    // 2. Recompute PO status
    if (grn.purchaseOrderId) {
      const totals = await client.query(
        `SELECT
           COUNT(*)::int AS lines,
           SUM(CASE WHEN COALESCE("receivedQty", 0) >= quantity THEN 1 ELSE 0 END)::int AS fully
         FROM "PurchaseOrderItem"
         WHERE "purchaseOrderId" = $1`,
        [grn.purchaseOrderId]
      )
      const { lines: totalLines, fully } = totals.rows[0]
      let newStatus: string | null = null
      if (totalLines > 0 && fully === totalLines) newStatus = 'FULLY_RECEIVED'
      else if (fully > 0 || lines.length > 0) newStatus = 'PARTIALLY_RECEIVED'

      if (newStatus) {
        // Never downgrade from CLOSED / CANCELLED / INVOICED / MATCHED
        await client.query(
          `UPDATE "PurchaseOrder"
           SET status = $1, "updatedAt" = NOW()
           WHERE id = $2 AND "organizationId" = $3
             AND status NOT IN ('CLOSED','CANCELLED','INVOICED','MATCHED')`,
          [newStatus, grn.purchaseOrderId, g.organizationId]
        )
      }
    }

    // 3. Mark GRN SUBMITTED
    await client.query(
      `UPDATE "GoodsReceipt"
       SET status = 'SUBMITTED', "updatedAt" = NOW()
       WHERE id = $1 AND "organizationId" = $2`,
      [id, g.organizationId]
    )

    // 4. Auto-create QualityInspection (PENDING) per line
    const crypto = require('crypto')
    for (const l of lines) {
      const existingInspection = await client.query(
        `SELECT id FROM "QualityInspection"
         WHERE "goodsReceiptLineId" = $1 LIMIT 1`,
        [l.id]
      )
      if (existingInspection.rowCount > 0) continue

      await client.query(
        `INSERT INTO "QualityInspection"
           (id, "organizationId", "goodsReceiptId", "goodsReceiptLineId",
            "purchaseOrderItemId", status, "createdAt", "updatedAt")
         VALUES ($1,$2,$3,$4,$5,'PENDING',NOW(),NOW())`,
        [
          crypto.randomUUID(),
          g.organizationId,
          id,
          l.id,
          l.purchaseOrderItemId,
        ]
      )
    }

    await client.query('COMMIT')
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('[grn-submit]', (err as Error).message)
    return NextResponse.json({ error: 'Submit failed: ' + (err as Error).message }, { status: 500 })
  } finally {
    client.release()
  }

  await logProcurementEvent(pool, {
    organizationId: g.organizationId,
    eventType: 'GOODS_RECEIPT_SUBMITTED',
    entityType: 'GoodsReceipt',
    entityId: id,
    actorId: g.userId,
    actorName: g.userName,
    summary: 'Submitted GRN ' + grn.grnNumber,
    metadata: { grnNumber: grn.grnNumber, linesCount: lines.length, purchaseOrderId: grn.purchaseOrderId },
  })

  return NextResponse.json({ ok: true })
})