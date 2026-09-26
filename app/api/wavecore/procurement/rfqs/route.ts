export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { assertProcurement, logProcurementEvent, procurementHandler } from '@/lib/wavecore/procurement-guard'

// Local numbering helper for RFQs.
// Uses the real ProcurementNumbering schema (scope / prefix / counter).
async function nextRfqNumber(pool: any, organizationId: string): Promise<string> {
  const year = new Date().getFullYear()
  const crypto = require('crypto')
  const id = crypto.randomUUID()

  const upd = await pool.query(
    `UPDATE "ProcurementNumbering"
     SET counter = counter + 1, "updatedAt" = NOW()
     WHERE "organizationId" = $1 AND scope = 'RFQ' AND year = $2
     RETURNING counter, prefix`,
    [organizationId, year]
  )

  let seq: number
  let prefix = 'RFQ'
  if (upd.rowCount > 0) {
    seq = upd.rows[0].counter
    prefix = upd.rows[0].prefix || 'RFQ'
  } else {
    const ins = await pool.query(
      `INSERT INTO "ProcurementNumbering"
         (id, "organizationId", scope, prefix, year, counter, "createdAt", "updatedAt")
       VALUES ($1, $2, 'RFQ', 'RFQ', $3, 1, NOW(), NOW())
       RETURNING counter, prefix`,
      [id, organizationId, year]
    )
    seq = ins.rows[0].counter
    prefix = ins.rows[0].prefix || 'RFQ'
  }
  const padded = String(seq).padStart(4, '0')
  return `${prefix}-${year}-${padded}`
}

const RFQ_TYPES = ['RFQ','RFP','RFI']
const RFQ_STATUSES = ['DRAFT','PUBLISHED','CLOSED','AWARDED','CANCELLED']

/**
 * GET /api/wavecore/procurement/rfqs
 * Filters: q, status, type, supplierId (invited), limit, offset
 * Sort: createdAt | closingDate | issueDate
 */
export const GET = procurementHandler(async (request: NextRequest) => {
  const g = await assertProcurement(request, 'READ')
  const { searchParams } = new URL(request.url)
  const q = (searchParams.get('q') || '').trim()
  const status = searchParams.get('status')
  const type = searchParams.get('type')
  const supplierId = searchParams.get('supplierId')
  const sort = searchParams.get('sort') || 'createdAt'
  const order = (searchParams.get('order') || 'desc').toLowerCase() === 'asc' ? 'ASC' : 'DESC'
  const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '50', 10) || 50, 1), 100)
  const offset = Math.max(parseInt(searchParams.get('offset') || '0', 10) || 0, 0)

  const where: string[] = ['r."organizationId" = $1']
  const params: any[] = [g.organizationId]

  if (q) {
    params.push('%' + q + '%')
    const n = params.length
    where.push('(r."rfqNumber" ILIKE $' + n + ' OR r.title ILIKE $' + n + ' OR r.description ILIKE $' + n + ' OR r.category ILIKE $' + n + ')')
  }
  if (status) { params.push(status); where.push('r.status = $' + params.length) }
  if (type) { params.push(type); where.push('r.type = $' + params.length) }
  if (supplierId) {
    params.push(supplierId)
    where.push('EXISTS (SELECT 1 FROM "RFQSupplierInvite" i WHERE i."rfqId" = r.id AND i."supplierId" = $' + params.length + ')')
  }

  const sortCol: Record<string, string> = {
    createdAt: 'r."createdAt"',
    closingDate: 'r."closingDate"',
    issueDate: 'r."issueDate"',
  }
  const sortSQL = sortCol[sort] || 'r."createdAt"'
  const whereSQL = where.join(' AND ')

  const countRes = await pool.query(
    `SELECT COUNT(*)::int AS total FROM "RFQ" r WHERE ${whereSQL}`,
    params
  )
  const total = countRes.rows[0]?.total || 0

  const listRes = await pool.query(
    `SELECT
       r.id, r."rfqNumber", r.title, r.description, r.type, r.category,
       r."requisitionId", r."purchaseOrderId",
       r.currency, r."issueDate", r."closingDate", r."deliveryDate",
       r."deliveryLocation", r."paymentTerms", r.status,
       r."publishedAt", r."awardedAt", r."awardedBidId",
       r."createdBy", r."createdByName", r.notes,
       r."createdAt", r."updatedAt",
       (SELECT COUNT(*)::int FROM "RFQLine" l WHERE l."rfqId" = r.id) AS "linesCount",
       (SELECT COUNT(*)::int FROM "RFQSupplierInvite" i WHERE i."rfqId" = r.id) AS "invitesCount",
       (SELECT COUNT(*)::int FROM "SupplierQuoteExt" q WHERE q."rfqId" = r.id) AS "quotesCount"
     FROM "RFQ" r
     WHERE ${whereSQL}
     ORDER BY ${sortSQL} ${order} NULLS LAST
     LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, limit, offset]
  )

  return NextResponse.json({
    rfqs: listRes.rows,
    total,
    limit,
    offset,
  })
})

/**
 * POST /api/wavecore/procurement/rfqs
 * Body: {
 *   title*, description?, type?, category?, currency?,
 *   requisitionId?, issueDate?, closingDate?, deliveryDate?,
 *   deliveryLocation?, paymentTerms?,
 *   evaluationCriteria?: any,
 *   notes?,
 *   lines?:     Array<{ description*, quantity*, unitOfMeasure?, specifications?, targetPrice?, notes? }>,
 *   supplierIds?: string[]
 * }
 */
export const POST = procurementHandler(async (request: NextRequest) => {
  const g = await assertProcurement(request, 'WRITE')

  let body: any
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const title = String(body?.title || '').trim()
  if (!title) return NextResponse.json({ error: 'title is required' }, { status: 400 })

  const type = String(body?.type || 'RFQ').toUpperCase()
  if (!RFQ_TYPES.includes(type)) {
    return NextResponse.json({ error: 'type must be one of ' + RFQ_TYPES.join(' | ') }, { status: 400 })
  }

  // Validate requisition link (if provided)
  if (body?.requisitionId) {
    const r = await pool.query(
      `SELECT id FROM "PurchaseRequisition" WHERE id = $1 AND "organizationId" = $2`,
      [body.requisitionId, g.organizationId]
    )
    if (r.rowCount === 0) return NextResponse.json({ error: 'Requisition not found' }, { status: 404 })
  }

  let rfqNumber: string
  try {
    rfqNumber = await nextRfqNumber(pool, g.organizationId)
  } catch (err) {
    console.error('[rfq] numbering failed:', (err as Error).message)
    return NextResponse.json({ error: 'Numbering table missing. Run procurement-rfq-extension.sql first.' }, { status: 500 })
  }

  const crypto = require('crypto')
  const rfqId = crypto.randomUUID()

  const client = await pool.connect()
  const insertedLines: any[] = []
  const insertedInvites: any[] = []
  try {
    await client.query('BEGIN')

    const insRes = await client.query(
      `INSERT INTO "RFQ"
         (id, "organizationId", "rfqNumber", title, description, type, category,
          currency, "requisitionId",
          "issueDate", "closingDate", "deliveryDate",
          "deliveryLocation", "paymentTerms", "evaluationCriteria",
          status, "createdBy", "createdByName", notes,
          "createdAt", "updatedAt")
       VALUES ($1,$2,$3,$4,$5,$6,$7,
               $8,$9,
               $10::timestamp,$11::timestamp,$12::timestamp,
               $13,$14,$15::jsonb,
               'DRAFT',$16,$17,$18,
               NOW(),NOW())
       RETURNING *`,
      [
        rfqId, g.organizationId, rfqNumber, title,
        body?.description || null, type, body?.category || null,
        body?.currency || 'KES', body?.requisitionId || null,
        body?.issueDate || null, body?.closingDate || null, body?.deliveryDate || null,
        body?.deliveryLocation || null, body?.paymentTerms || null,
        body?.evaluationCriteria ? JSON.stringify(body.evaluationCriteria) : null,
        g.userId, g.userName, body?.notes || null,
      ]
    )
    const rfq = insRes.rows[0]

    // Lines
    const rawLines = Array.isArray(body?.lines) ? body.lines : []
    if (rawLines.length > 500) {
      await client.query('ROLLBACK')
      return NextResponse.json({ error: 'Too many lines (max 500)' }, { status: 400 })
    }
    for (let i = 0; i < rawLines.length; i++) {
      const l = rawLines[i]
      const desc = String(l?.description || '').trim()
      if (!desc) {
        await client.query('ROLLBACK')
        return NextResponse.json({ error: 'Line ' + (i+1) + ': description required' }, { status: 400 })
      }
      const r = await client.query(
        `INSERT INTO "RFQLine"
           (id, "organizationId", "rfqId", "lineNumber", description,
            quantity, "unitOfMeasure", specifications, "targetPrice", notes,
            "createdAt", "updatedAt")
         VALUES ($1,$2,$3,$4,$5,
                 $6,$7,$8,$9,$10,
                 NOW(),NOW())
         RETURNING *`,
        [
          crypto.randomUUID(), g.organizationId, rfqId, i + 1, desc,
          Number(l?.quantity) || 0, l?.unitOfMeasure || 'UNIT',
          l?.specifications || null, Number(l?.targetPrice) || 0,
          l?.notes || null,
        ]
      )
      insertedLines.push(r.rows[0])
    }

    // Invites
    const supplierIds: string[] = Array.isArray(body?.supplierIds)
      ? body.supplierIds.map((s: any) => String(s)).filter(Boolean)
      : []
    if (supplierIds.length > 200) {
      await client.query('ROLLBACK')
      return NextResponse.json({ error: 'Too many suppliers (max 200)' }, { status: 400 })
    }
    for (const sid of supplierIds) {
      // Ensure supplier exists
      const s = await client.query(`SELECT id FROM "Supplier" WHERE id = $1`, [sid])
      if (s.rowCount === 0) continue
      const r = await client.query(
        `INSERT INTO "RFQSupplierInvite"
           (id, "organizationId", "rfqId", "supplierId", status, "invitedAt",
            "inviteToken", "createdAt", "updatedAt")
         VALUES ($1,$2,$3,$4,'INVITED',NOW(),$5,NOW(),NOW())
         RETURNING *`,
        [crypto.randomUUID(), g.organizationId, rfqId, sid, crypto.randomUUID()]
      )
      insertedInvites.push(r.rows[0])
    }

    await client.query('COMMIT')

    await logProcurementEvent(pool, {
      organizationId: g.organizationId,
      eventType: 'RFQ_CREATED',
      entityType: 'RFQ',
      entityId: rfqId,
      actorId: g.userId,
      actorName: g.userName,
      summary: 'Created ' + rfqNumber,
      metadata: {
        rfqNumber, type,
        linesCount: insertedLines.length,
        invitesCount: insertedInvites.length,
      },
    })

    return NextResponse.json({
      rfq,
      lines: insertedLines,
      invites: insertedInvites,
    }, { status: 201 })
  } catch (err) {
    try { await client.query('ROLLBACK') } catch {}
    console.error('[rfq-create]', (err as Error).message)
    return NextResponse.json({ error: 'Create failed: ' + (err as Error).message }, { status: 500 })
  } finally {
    client.release()
  }
})