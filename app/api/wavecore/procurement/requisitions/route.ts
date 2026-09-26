export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { assertProcurement, logProcurementEvent, procurementHandler } from '@/lib/wavecore/procurement-guard'
import { nextProcurementNumber } from '@/lib/wavecore/procurement-numbering'

/**
 * GET /api/wavecore/procurement/requisitions
 * Query params:
 *   q          — search title/description/number
 *   status     — DRAFT | SUBMITTED | APPROVED | REJECTED | CONVERTED | CANCELLED
 *   priority   — LOW | NORMAL | HIGH | URGENT
 *   category   — GENERAL | IT | ... (any string)
 *   mine       — 'true' → only requisitions requested by me
 *   limit      — max 100, default 50
 *   offset     — default 0
 *   sort       — createdAt | totalAmount | neededBy | status (default: createdAt)
 *   order      — asc | desc (default: desc)
 */
export const GET = procurementHandler(async (request: NextRequest) => {
  const g = await assertProcurement(request, 'READ')

  const { searchParams } = new URL(request.url)
  const q        = (searchParams.get('q') || '').trim()
  const status   = searchParams.get('status')
  const priority = searchParams.get('priority')
  const category = searchParams.get('category')
  const mine     = searchParams.get('mine') === 'true'
  const sort     = searchParams.get('sort') || 'createdAt'
  const order    = (searchParams.get('order') || 'desc').toLowerCase() === 'asc' ? 'ASC' : 'DESC'
  const limit    = Math.min(Math.max(parseInt(searchParams.get('limit') || '50', 10) || 50, 1), 100)
  const offset   = Math.max(parseInt(searchParams.get('offset') || '0', 10) || 0, 0)

  const where: string[] = ['"organizationId" = $1']
  const params: any[] = [g.organizationId]

  if (q) {
    params.push('%' + q + '%')
    const n = params.length
    where.push('("title" ILIKE $' + n + ' OR "description" ILIKE $' + n + ' OR "requisitionNumber" ILIKE $' + n + ')')
  }
  if (status)   { params.push(status);   where.push('"status" = $' + params.length) }
  if (priority) { params.push(priority); where.push('"priority" = $' + params.length) }
  if (category) { params.push(category); where.push('"category" = $' + params.length) }
  if (mine)     { params.push(g.userId); where.push('"requestedBy" = $' + params.length) }

  const sortCol: Record<string, string> = {
    createdAt: '"createdAt"',
    totalAmount: '"totalAmount"',
    neededBy: '"neededBy"',
    status: '"status"',
    priority: '"priority"',
  }
  const sortSQL = sortCol[sort] || '"createdAt"'
  const whereSQL = where.join(' AND ')

  const countRes = await pool.query(
    `SELECT COUNT(*)::int AS total FROM "PurchaseRequisition" WHERE ${whereSQL}`,
    params
  )
  const total = countRes.rows[0]?.total || 0

  const listParams = [...params, limit, offset]
  const listRes = await pool.query(
    `SELECT
       r.id, r."requisitionNumber", r.title, r.description, r.category, r.priority, r.type,
       r."requestedBy", r."requestedByName", r."departmentId", r."projectId",
       r.currency, r.subtotal, r."taxAmount", r."totalAmount",
       r.status, r."currentApprovalStep", r."totalApprovalSteps",
       r."neededBy", r."submittedAt", r."approvedAt", r."rejectedAt", r."rejectionReason",
       r."isEmergency", r."isRecurring", r."createdAt", r."updatedAt",
       (SELECT COUNT(*)::int FROM "PurchaseRequisitionLine" l
          WHERE l."requisitionId" = r.id AND l."organizationId" = r."organizationId") AS "linesCount",
       (SELECT COUNT(*)::int FROM "PurchaseRequisitionApproval" a
          WHERE a."requisitionId" = r.id AND a."organizationId" = r."organizationId" AND a.status = 'PENDING') AS "pendingApprovals"
     FROM "PurchaseRequisition" r
     WHERE ${whereSQL}
     ORDER BY ${sortSQL} ${order} NULLS LAST
     LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    listParams
  )

  return NextResponse.json({
    requisitions: listRes.rows,
    total,
    limit,
    offset,
  })
})

/**
 * POST /api/wavecore/procurement/requisitions
 * Body:
 * {
 *   title*:           string
 *   description?:     string
 *   category?:        string  (default GENERAL)
 *   priority?:        LOW | NORMAL | HIGH | URGENT  (default NORMAL)
 *   type?:            STANDARD | CAPEX | OPEX | SERVICE | INVENTORY | EMERGENCY
 *   departmentId?:    string
 *   projectId?:       string
 *   costCenter?:      string
 *   location?:        string
 *   currency?:        string  (default KES)
 *   neededBy?:        ISO date
 *   budgetId?:        string
 *   isEmergency?:     boolean
 *   notes?:           string
 *   lines?:           Array<{ description*, quantity*, unitPrice?, taxRate?, unitOfMeasure?, specifications?, preferredSupplierId? }>
 * }
 *
 * Returns the created requisition + its lines.
 * Status starts as DRAFT (use /submit to enter the approval workflow).
 */
export const POST = procurementHandler(async (request: NextRequest) => {
  const g = await assertProcurement(request, 'WRITE')

  let body: any
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const title = String(body?.title || '').trim()
  if (!title) return NextResponse.json({ error: 'Title is required' }, { status: 400 })
  if (title.length > 300) return NextResponse.json({ error: 'Title too long (max 300)' }, { status: 400 })

  // Validate lines if provided
  const rawLines = Array.isArray(body?.lines) ? body.lines : []
  if (rawLines.length > 200) return NextResponse.json({ error: 'Too many lines (max 200)' }, { status: 400 })

  const lines: any[] = []
  let subtotal = 0
  let taxTotal = 0
  for (let i = 0; i < rawLines.length; i++) {
    const l = rawLines[i]
    const desc = String(l?.description || '').trim()
    if (!desc) return NextResponse.json({ error: 'Line ' + (i + 1) + ': description required' }, { status: 400 })
    const qty = Number(l?.quantity)
    if (!Number.isFinite(qty) || qty <= 0) return NextResponse.json({ error: 'Line ' + (i + 1) + ': quantity must be > 0' }, { status: 400 })
    const price = Number(l?.unitPrice) || 0
    const taxRate = Number(l?.taxRate) || 0
    const lineSub = qty * price
    const lineTax = lineSub * (taxRate / 100)
    const lineTotal = lineSub + lineTax
    subtotal += lineSub
    taxTotal += lineTax
    lines.push({
      description: desc,
      productId: l?.productId || null,
      category: l?.category || null,
      quantity: qty,
      unitOfMeasure: l?.unitOfMeasure || 'UNIT',
      unitPrice: price,
      taxRate,
      lineTotal,
      specifications: l?.specifications || null,
      preferredSupplierId: l?.preferredSupplierId || null,
      notes: l?.notes || null,
    })
  }
  const totalAmount = subtotal + taxTotal

  // Generate requisition number
  let requisitionNumber: string
  try {
    requisitionNumber = await nextProcurementNumber(pool, g.organizationId, 'REQ')
  } catch (err) {
    console.error('[requisitions] numbering failed:', (err as Error).message)
    return NextResponse.json({
      error: 'Numbering table missing. Please run the procurement numbering migration.',
    }, { status: 500 })
  }

  const crypto = require('crypto')
  const id = crypto.randomUUID()

  // Insert requisition
  const reqRes = await pool.query(
    `INSERT INTO "PurchaseRequisition"
       (id, "organizationId", "requisitionNumber", title, description, category, priority, type,
        "requestedBy", "requestedByName", "departmentId", "projectId", "costCenter", location,
        currency, subtotal, "taxAmount", "totalAmount", "budgetId", "neededBy",
        status, "currentApprovalStep", "totalApprovalSteps",
        "isEmergency", "isRecurring", notes, "createdAt", "updatedAt")
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,
             $15,$16,$17,$18,$19,$20,
             'DRAFT',0,0,
             $21,$22,$23,NOW(),NOW())
     RETURNING *`,
    [
      id, g.organizationId, requisitionNumber, title,
      body?.description || null,
      body?.category || 'GENERAL',
      (['LOW','NORMAL','HIGH','URGENT'].includes(body?.priority) ? body.priority : 'NORMAL'),
      (['STANDARD','CAPEX','OPEX','SERVICE','INVENTORY','EMERGENCY'].includes(body?.type) ? body.type : 'STANDARD'),
      g.userId, g.userName,
      body?.departmentId || null,
      body?.projectId || null,
      body?.costCenter || null,
      body?.location || null,
      body?.currency || 'KES',
      subtotal, taxTotal, totalAmount,
      body?.budgetId || null,
      body?.neededBy || null,
      Boolean(body?.isEmergency),
      Boolean(body?.isRecurring),
      body?.notes || null,
    ]
  )
  const requisition = reqRes.rows[0]

  // Insert lines
  const insertedLines: any[] = []
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i]
    const lineId = crypto.randomUUID()
    const r = await pool.query(
      `INSERT INTO "PurchaseRequisitionLine"
         (id, "organizationId", "requisitionId", "lineNumber", description,
          "productId", category, quantity, "unitOfMeasure", "unitPrice", "taxRate",
          "lineTotal", specifications, "preferredSupplierId", notes, "createdAt", "updatedAt")
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,NOW(),NOW())
       RETURNING *`,
      [
        lineId, g.organizationId, id, i + 1, l.description,
        l.productId, l.category, l.quantity, l.unitOfMeasure, l.unitPrice, l.taxRate,
        l.lineTotal, l.specifications, l.preferredSupplierId, l.notes,
      ]
    )
    insertedLines.push(r.rows[0])
  }

  await logProcurementEvent(pool, {
    organizationId: g.organizationId,
    eventType: 'REQUISITION_CREATED',
    entityType: 'PurchaseRequisition',
    entityId: id,
    actorId: g.userId,
    actorName: g.userName,
    summary: 'Created requisition ' + requisitionNumber + ': ' + title,
    metadata: {
      requisitionNumber,
      linesCount: insertedLines.length,
      totalAmount,
      currency: body?.currency || 'KES',
      priority: requisition.priority,
    },
  })

  return NextResponse.json({
    requisition,
    lines: insertedLines,
  }, { status: 201 })
})