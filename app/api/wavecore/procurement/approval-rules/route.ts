export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { assertProcurement, logProcurementEvent, procurementHandler } from '@/lib/wavecore/procurement-guard'

/**
 * GET /api/wavecore/procurement/approval-rules
 * Query: appliesTo (REQUISITION | PURCHASE_ORDER), isActive (true|false)
 */
export const GET = procurementHandler(async (request: NextRequest) => {
  const g = await assertProcurement(request, 'READ')
  const { searchParams } = new URL(request.url)
  const appliesTo = searchParams.get('appliesTo')
  const isActive = searchParams.get('isActive')

  const where: string[] = ['"organizationId" = $1']
  const params: any[] = [g.organizationId]
  if (appliesTo) { params.push(appliesTo); where.push('"appliesTo" = $' + params.length) }
  if (isActive !== null && isActive !== undefined && isActive !== '') {
    params.push(isActive === 'true')
    where.push('"isActive" = $' + params.length)
  }

  const r = await pool.query(
    `SELECT * FROM "ProcurementApprovalRule"
     WHERE ${where.join(' AND ')}
     ORDER BY "appliesTo" ASC, "stepNumber" ASC, "minAmount" ASC`,
    params
  )

  return NextResponse.json({ rules: r.rows })
})

/**
 * POST /api/wavecore/procurement/approval-rules
 * Body: {
 *   name*, appliesTo?: 'REQUISITION' | 'PURCHASE_ORDER',
 *   minAmount?: number, maxAmount?: number|null,
 *   category?: string|null, departmentId?: string|null, location?: string|null,
 *   currency?: string, approverRole*, approverUserId?: string|null,
 *   stepNumber*: number, isRequired?: boolean, slaHours?: number
 * }
 */
export const POST = procurementHandler(async (request: NextRequest) => {
  const g = await assertProcurement(request, 'WRITE')

  let body: any
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const name = String(body?.name || '').trim()
  if (!name) return NextResponse.json({ error: 'name is required' }, { status: 400 })

  const approverRole = String(body?.approverRole || '').trim()
  if (!approverRole) return NextResponse.json({ error: 'approverRole is required' }, { status: 400 })

  const stepNumber = Number(body?.stepNumber)
  if (!Number.isFinite(stepNumber) || stepNumber < 1) {
    return NextResponse.json({ error: 'stepNumber must be >= 1' }, { status: 400 })
  }

  const appliesTo = ['REQUISITION', 'PURCHASE_ORDER'].includes(body?.appliesTo)
    ? body.appliesTo
    : 'REQUISITION'

  const minAmount = Number(body?.minAmount || 0)
  const maxAmount = body?.maxAmount === null || body?.maxAmount === undefined || body?.maxAmount === ''
    ? null
    : Number(body.maxAmount)

  if (!Number.isFinite(minAmount) || minAmount < 0) {
    return NextResponse.json({ error: 'minAmount must be >= 0' }, { status: 400 })
  }
  if (maxAmount !== null && (!Number.isFinite(maxAmount) || maxAmount <= minAmount)) {
    return NextResponse.json({ error: 'maxAmount must be > minAmount' }, { status: 400 })
  }

  const slaHours = Number(body?.slaHours)
  const crypto = require('crypto')
  const id = crypto.randomUUID()

  const r = await pool.query(
    `INSERT INTO "ProcurementApprovalRule"
       (id, "organizationId", name, "appliesTo", "minAmount", "maxAmount",
        category, "departmentId", location, currency,
        "approverRole", "approverUserId", "stepNumber", "isRequired", "slaHours",
        "isActive", "createdBy", "createdAt", "updatedAt")
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,
             TRUE,$16,NOW(),NOW())
     RETURNING *`,
    [
      id, g.organizationId, name, appliesTo,
      minAmount, maxAmount,
      body?.category || null,
      body?.departmentId || null,
      body?.location || null,
      body?.currency || 'KES',
      approverRole, body?.approverUserId || null,
      stepNumber,
      body?.isRequired === false ? false : true,
      Number.isFinite(slaHours) && slaHours > 0 ? slaHours : 48,
      g.userId,
    ]
  )

  await logProcurementEvent(pool, {
    organizationId: g.organizationId,
    eventType: 'PROCUREMENT_APPROVAL_RULE_CREATED',
    entityType: 'ProcurementApprovalRule',
    entityId: id,
    actorId: g.userId,
    actorName: g.userName,
    summary: 'Created approval rule: ' + name,
    metadata: { appliesTo, stepNumber, approverRole, minAmount, maxAmount },
  })

  return NextResponse.json({ rule: r.rows[0] }, { status: 201 })
})