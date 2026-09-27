export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { assertProcurement, logProcurementEvent, procurementHandler } from '@/lib/wavecore/procurement-guard'

/**
 * GET /api/wavecore/procurement/rfqs/[id]/quotes
 * Returns quotes grouped by supplier for bid analysis.
 */
export const GET = procurementHandler(async (request: NextRequest, ctx: { params: { id: string } }) => {
  const g = await assertProcurement(request, 'READ')
  const id = ctx.params.id

  const r = await pool.query(
    `SELECT q.*, s.name AS "supplierName", l.description AS "lineDescription",
            l.quantity AS "lineQuantity", l."unitOfMeasure" AS "lineUom"
     FROM "SupplierQuoteExt" q
     LEFT JOIN "Supplier" s ON s.id = q."supplierId"
     LEFT JOIN "RFQLine" l ON l.id = q."rfqLineId"
     WHERE q."rfqId" = $1 AND q."organizationId" = $2
     ORDER BY q."supplierId", q."createdAt"`,
    [id, g.organizationId]
  )

  // Group by supplier
  const grouped: Record<string, { supplierId: string; supplierName: string; lines: any[]; total: number; leadTimeAvg: number }> = {}
  for (const q of r.rows) {
    if (!grouped[q.supplierId]) {
      grouped[q.supplierId] = { supplierId: q.supplierId, supplierName: q.supplierName, lines: [], total: 0, leadTimeAvg: 0 }
    }
    grouped[q.supplierId].lines.push(q)
    grouped[q.supplierId].total += Number(q.lineTotal || 0)
    grouped[q.supplierId].leadTimeAvg += Number(q.leadTimeDays || 0)
  }
  const quotes = Object.values(grouped).map(g => ({
    ...g,
    leadTimeAvg: g.lines.length > 0 ? Math.round(g.leadTimeAvg / g.lines.length) : 0,
  }))

  return NextResponse.json({ quotes, totalSuppliers: quotes.length })
})

/**
 * POST /api/wavecore/procurement/rfqs/[id]/quotes
 * Body: {
 *   supplierId*: string,
 *   lines*: Array<{
 *     rfqLineId*: string,
 *     quantity: number,
 *     unitPrice*: number,
 *     taxRate?: number,
 *     leadTimeDays?: number,
 *     incoterms?: string,
 *     validUntil?: ISO date,
 *     notes?: string
 *   }>
 * }
 *
 * Rules:
 *  - RFQ must be PUBLISHED
 *  - Refuses after closingDate
 *  - Replaces any existing quotes for this supplier on this RFQ
 *    (idempotent resubmission)
 */
export const POST = procurementHandler(async (request: NextRequest, ctx: { params: { id: string } }) => {
  const g = await assertProcurement(request, 'WRITE')
  const id = ctx.params.id

  const rfqRes = await pool.query(
    `SELECT * FROM "RFQ" WHERE id = $1 AND "organizationId" = $2`,
    [id, g.organizationId]
  )
  if (rfqRes.rowCount === 0) return NextResponse.json({ error: 'RFQ not found' }, { status: 404 })
  const rfq = rfqRes.rows[0]
  if (rfq.status !== 'PUBLISHED') {
    return NextResponse.json({ error: 'Quotes can only be submitted on PUBLISHED RFQs (current: ' + rfq.status + ')' }, { status: 409 })
  }
  if (rfq.closingDate && new Date(rfq.closingDate).getTime() < Date.now()) {
    return NextResponse.json({ error: 'RFQ closing date has passed' }, { status: 409 })
  }

  let body: any
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const supplierId = String(body?.supplierId || '').trim()
  if (!supplierId) return NextResponse.json({ error: 'supplierId required' }, { status: 400 })

  // Supplier must be invited
  const inv = await pool.query(
    `SELECT id FROM "RFQSupplierInvite"
     WHERE "rfqId" = $1 AND "supplierId" = $2 AND "organizationId" = $3`,
    [id, supplierId, g.organizationId]
  )
  if (inv.rowCount === 0) return NextResponse.json({ error: 'Supplier is not invited to this RFQ' }, { status: 403 })

  const rawLines = Array.isArray(body?.lines) ? body.lines : []
  if (rawLines.length === 0) return NextResponse.json({ error: 'At least one quote line required' }, { status: 400 })
  if (rawLines.length > 500) return NextResponse.json({ error: 'Too many lines (max 500)' }, { status: 400 })

  const client = await pool.connect()
  const inserted: any[] = []
  try {
    await client.query('BEGIN')

    // Wipe previous quotes from this supplier on this RFQ
    await client.query(
      `DELETE FROM "SupplierQuoteExt"
       WHERE "rfqId" = $1 AND "supplierId" = $2 AND "organizationId" = $3`,
      [id, supplierId, g.organizationId]
    )

    const crypto = require('crypto')
    for (let i = 0; i < rawLines.length; i++) {
      const l = rawLines[i]
      const rfqLineId = String(l?.rfqLineId || '').trim()
      if (!rfqLineId) {
        await client.query('ROLLBACK')
        return NextResponse.json({ error: 'Line ' + (i+1) + ': rfqLineId required' }, { status: 400 })
      }
      const lineCheck = await client.query(
        `SELECT id, quantity FROM "RFQLine"
         WHERE id = $1 AND "rfqId" = $2 AND "organizationId" = $3`,
        [rfqLineId, id, g.organizationId]
      )
      if (lineCheck.rowCount === 0) {
        await client.query('ROLLBACK')
        return NextResponse.json({ error: 'Line ' + (i+1) + ': RFQ line not found' }, { status: 400 })
      }
      const qty = Number(l?.quantity) || Number(lineCheck.rows[0].quantity) || 0
      const price = Number(l?.unitPrice)
      if (!Number.isFinite(price) || price < 0) {
        await client.query('ROLLBACK')
        return NextResponse.json({ error: 'Line ' + (i+1) + ': unitPrice must be >= 0' }, { status: 400 })
      }
      const tax = Number(l?.taxRate) || 0
      const lineTotal = qty * price * (1 + tax / 100)

      const r = await client.query(
        `INSERT INTO "SupplierQuoteExt"
           (id, "organizationId", "rfqId", "rfqLineId", "supplierId",
            quantity, "unitPrice", "taxRate", "lineTotal", currency,
            "leadTimeDays", incoterms, "validUntil",
            status, notes, "submittedAt", "createdAt", "updatedAt")
         VALUES ($1,$2,$3,$4,$5,
                 $6,$7,$8,$9,$10,
                 $11,$12,$13::timestamp,
                 'SUBMITTED',$14,NOW(),NOW(),NOW())
         RETURNING *`,
        [
          crypto.randomUUID(), g.organizationId, id, rfqLineId, supplierId,
          qty, price, tax, lineTotal, l?.currency || rfq.currency || 'KES',
          l?.leadTimeDays != null ? Number(l.leadTimeDays) : null,
          l?.incoterms || null,
          l?.validUntil || null,
          l?.notes || null,
        ]
      )
      inserted.push(r.rows[0])
    }

    // Mark invite as RESPONDED
    await client.query(
      `UPDATE "RFQSupplierInvite"
       SET status = 'RESPONDED', "respondedAt" = NOW(), "updatedAt" = NOW()
       WHERE "rfqId" = $1 AND "supplierId" = $2 AND "organizationId" = $3`,
      [id, supplierId, g.organizationId]
    )

    await client.query('COMMIT')
  } catch (err) {
    try { await client.query('ROLLBACK') } catch {}
    console.error('[rfq-quote]', (err as Error).message)
    return NextResponse.json({ error: 'Quote submission failed: ' + (err as Error).message }, { status: 500 })
  } finally {
    client.release()
  }

  const total = inserted.reduce((s, q) => s + Number(q.lineTotal || 0), 0)

  await logProcurementEvent(pool, {
    organizationId: g.organizationId,
    eventType: 'RFQ_QUOTE_SUBMITTED',
    entityType: 'RFQ',
    entityId: id,
    actorId: g.userId,
    actorName: g.userName,
    summary: 'Quote from supplier — ' + inserted.length + ' line(s)',
    metadata: { supplierId, linesCount: inserted.length, total },
  })

  return NextResponse.json({ quotes: inserted, total }, { status: 201 })
})