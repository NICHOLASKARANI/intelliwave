export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { assertProcurement, logProcurementEvent, procurementHandler } from '@/lib/wavecore/procurement-guard'

// Local numbering helper for contracts.
// Uses the real ProcurementNumbering schema (scope / prefix / counter).
async function nextContractNumber(pool: any, organizationId: string): Promise<string> {
  const year = new Date().getFullYear()
  const crypto = require('crypto')
  const id = crypto.randomUUID()

  const upd = await pool.query(
    `UPDATE "ProcurementNumbering"
     SET counter = counter + 1, "updatedAt" = NOW()
     WHERE "organizationId" = $1 AND scope = 'CTR' AND year = $2
     RETURNING counter, prefix`,
    [organizationId, year]
  )

  let seq: number
  let prefix = 'CTR'
  if (upd.rowCount > 0) {
    seq = upd.rows[0].counter
    prefix = upd.rows[0].prefix || 'CTR'
  } else {
    const ins = await pool.query(
      `INSERT INTO "ProcurementNumbering"
         (id, "organizationId", scope, prefix, year, counter, "createdAt", "updatedAt")
       VALUES ($1, $2, 'CTR', 'CTR', $3, 1, NOW(), NOW())
       RETURNING counter, prefix`,
      [id, organizationId, year]
    )
    seq = ins.rows[0].counter
    prefix = ins.rows[0].prefix || 'CTR'
  }
  const padded = String(seq).padStart(4, '0')
  return `${prefix}-${year}-${padded}`
}

const CONTRACT_TYPES = ['SERVICE','GOODS','MAINTENANCE','NDA','MSA','LEASE','OTHER']
const CONTRACT_STATUSES = ['DRAFT','ACTIVE','SUSPENDED','EXPIRED','TERMINATED']

/**
 * GET /api/wavecore/procurement/contracts
 * Filters: q, status, supplierId, type, limit, offset
 * Sort: createdAt (default desc) | endDate | startDate | value
 */
export const GET = procurementHandler(async (request: NextRequest) => {
  const g = await assertProcurement(request, 'READ')
  const { searchParams } = new URL(request.url)
  const q = (searchParams.get('q') || '').trim()
  const status = searchParams.get('status')
  const supplierId = searchParams.get('supplierId')
  const type = searchParams.get('type')
  const sort = searchParams.get('sort') || 'createdAt'
  const order = (searchParams.get('order') || 'desc').toLowerCase() === 'asc' ? 'ASC' : 'DESC'
  const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '50', 10) || 50, 1), 100)
  const offset = Math.max(parseInt(searchParams.get('offset') || '0', 10) || 0, 0)

  const where: string[] = ['sc."organizationId" = $1']
  const params: any[] = [g.organizationId]

  if (q) {
    params.push('%' + q + '%')
    const n = params.length
    where.push('(sc."contractNumber" ILIKE $' + n + ' OR sc.title ILIKE $' + n + ' OR sc."supplierName" ILIKE $' + n + ' OR sc.notes ILIKE $' + n + ')')
  }
  if (status) { params.push(status); where.push('sc.status = $' + params.length) }
  if (supplierId) { params.push(supplierId); where.push('sc."supplierId" = $' + params.length) }
  if (type) { params.push(type); where.push('sc.type = $' + params.length) }

  const sortCol: Record<string, string> = {
    createdAt: 'sc."createdAt"',
    endDate: 'sc."endDate"',
    startDate: 'sc."startDate"',
    value: 'sc.value',
  }
  const sortSQL = sortCol[sort] || 'sc."createdAt"'
  const whereSQL = where.join(' AND ')

  const countRes = await pool.query(
    `SELECT COUNT(*)::int AS total FROM "SupplierContract" sc WHERE ${whereSQL}`,
    params
  )
  const total = countRes.rows[0]?.total || 0

  const listRes = await pool.query(
    `SELECT
       sc.id, sc."contractNumber", sc.title,
       sc."supplierId", sc."supplierName",
       sc.type, sc."startDate", sc."endDate",
       sc.value, sc.currency, sc."paymentTerms", sc.status,
       sc."autoRenew", sc."renewalNoticeDays",
       sc."signedAt", sc."signedByName",
       sc.notes, sc."createdAt", sc."updatedAt",
       (SELECT COUNT(*)::int FROM "SupplierContractLine" l
          WHERE l."contractId" = sc.id) AS "linesCount",
       (SELECT COUNT(*)::int FROM "SupplierContractMilestone" m
          WHERE m."contractId" = sc.id) AS "milestonesCount"
     FROM "SupplierContract" sc
     WHERE ${whereSQL}
     ORDER BY ${sortSQL} ${order} NULLS LAST
     LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, limit, offset]
  )

  return NextResponse.json({
    contracts: listRes.rows,
    total,
    limit,
    offset,
  })
})

/**
 * POST /api/wavecore/procurement/contracts
 * Body: {
 *   title*, type?, supplierId?, startDate?, endDate?, value?, currency?,
 *   paymentTerms?, autoRenew?, renewalNoticeDays?, notes?,
 *   lines?: Array<{ description*, quantity*, unitPrice*, taxRate?, unitOfMeasure?, notes? }>,
 *   milestones?: Array<{ name*, dueDate?, amount?, notes? }>
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

  const type = String(body?.type || 'SERVICE').toUpperCase()
  if (!CONTRACT_TYPES.includes(type)) {
    return NextResponse.json({ error: 'type must be one of ' + CONTRACT_TYPES.join(' | ') }, { status: 400 })
  }

  // Validate supplier (if provided)
  let supplierName: string | null = null
  if (body?.supplierId) {
    const r = await pool.query(
      `SELECT id, name, "legalName" FROM "Supplier" WHERE id = $1`,
      [body.supplierId]
    )
    if (r.rowCount === 0) return NextResponse.json({ error: 'Supplier not found' }, { status: 404 })
    supplierName = r.rows[0].name || r.rows[0].legalName || null
  }

  let contractNumber: string
  try {
    contractNumber = await nextContractNumber(pool, g.organizationId)
  } catch (err) {
    console.error('[ctr] numbering failed:', (err as Error).message)
    return NextResponse.json({ error: 'Numbering table missing. Run procurement-contract-extension.sql first.' }, { status: 500 })
  }

  const crypto = require('crypto')
  const contractId = crypto.randomUUID()

  const client = await pool.connect()
  const insertedLines: any[] = []
  const insertedMilestones: any[] = []
  try {
    await client.query('BEGIN')

    const insRes = await client.query(
      `INSERT INTO "SupplierContract"
         (id, "organizationId", "contractNumber", title,
          "supplierId", "supplierName", type,
          "startDate", "endDate", value, currency, "paymentTerms",
          status, "autoRenew", "renewalNoticeDays",
          notes, "createdBy", "createdByName",
          "createdAt", "updatedAt")
       VALUES ($1,$2,$3,$4,
               $5,$6,$7,
               $8::timestamp,$9::timestamp,$10,$11,$12,
               'DRAFT',$13,$14,
               $15,$16,$17,
               NOW(),NOW())
       RETURNING *`,
      [
        contractId, g.organizationId, contractNumber, title,
        body?.supplierId || null, supplierName, type,
        body?.startDate || null, body?.endDate || null,
        Number(body?.value) || 0,
        body?.currency || 'KES',
        Number(body?.paymentTerms) || 30,
        Boolean(body?.autoRenew),
        Number(body?.renewalNoticeDays) || 30,
        body?.notes || null,
        g.userId, g.userName,
      ]
    )
    const contract = insRes.rows[0]

    // Lines
    const rawLines = Array.isArray(body?.lines) ? body.lines : []
    if (rawLines.length > 200) {
      await client.query('ROLLBACK')
      return NextResponse.json({ error: 'Too many lines (max 200)' }, { status: 400 })
    }
    for (let i = 0; i < rawLines.length; i++) {
      const l = rawLines[i]
      const desc = String(l?.description || '').trim()
      if (!desc) {
        await client.query('ROLLBACK')
        return NextResponse.json({ error: 'Line ' + (i+1) + ': description required' }, { status: 400 })
      }
      const qty = Number(l?.quantity) || 0
      const price = Number(l?.unitPrice) || 0
      const tax = Number(l?.taxRate) || 0
      const lineTotal = qty * price * (1 + tax / 100)
      const lineId = crypto.randomUUID()
      const r = await client.query(
        `INSERT INTO "SupplierContractLine"
           (id, "organizationId", "contractId", "lineNumber", description,
            quantity, "unitPrice", "taxRate", "lineTotal", "unitOfMeasure",
            notes, "createdAt", "updatedAt")
         VALUES ($1,$2,$3,$4,$5,
                 $6,$7,$8,$9,$10,
                 $11,NOW(),NOW())
         RETURNING *`,
        [
          lineId, g.organizationId, contractId, i + 1, desc,
          qty, price, tax, lineTotal, l?.unitOfMeasure || 'UNIT',
          l?.notes || null,
        ]
      )
      insertedLines.push(r.rows[0])
    }

    // Milestones
    const rawMs = Array.isArray(body?.milestones) ? body.milestones : []
    if (rawMs.length > 100) {
      await client.query('ROLLBACK')
      return NextResponse.json({ error: 'Too many milestones (max 100)' }, { status: 400 })
    }
    for (let i = 0; i < rawMs.length; i++) {
      const m = rawMs[i]
      const name = String(m?.name || '').trim()
      if (!name) {
        await client.query('ROLLBACK')
        return NextResponse.json({ error: 'Milestone ' + (i+1) + ': name required' }, { status: 400 })
      }
      const msId = crypto.randomUUID()
      const r = await client.query(
        `INSERT INTO "SupplierContractMilestone"
           (id, "organizationId", "contractId", name, "dueDate", amount,
            status, notes, "createdAt", "updatedAt")
         VALUES ($1,$2,$3,$4,
                 $5::timestamp,$6,
                 'PENDING',$7,NOW(),NOW())
         RETURNING *`,
        [
          msId, g.organizationId, contractId, name,
          m?.dueDate || null, Number(m?.amount) || 0,
          m?.notes || null,
        ]
      )
      insertedMilestones.push(r.rows[0])
    }

    await client.query('COMMIT')

    await logProcurementEvent(pool, {
      organizationId: g.organizationId,
      eventType: 'SUPPLIER_CONTRACT_CREATED',
      entityType: 'SupplierContract',
      entityId: contractId,
      actorId: g.userId,
      actorName: g.userName,
      summary: 'Created ' + contractNumber,
      metadata: {
        contractNumber, type,
        supplierId: body?.supplierId || null,
        linesCount: insertedLines.length,
        milestonesCount: insertedMilestones.length,
      },
    })

    return NextResponse.json({
      contract,
      lines: insertedLines,
      milestones: insertedMilestones,
    }, { status: 201 })
  } catch (err) {
    try { await client.query('ROLLBACK') } catch {}
    console.error('[ctr-create]', (err as Error).message)
    return NextResponse.json({ error: 'Create failed: ' + (err as Error).message }, { status: 500 })
  } finally {
    client.release()
  }
})