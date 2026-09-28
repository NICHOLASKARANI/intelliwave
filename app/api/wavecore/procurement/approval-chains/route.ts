export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { assertProcurement, logProcurementEvent, procurementHandler } from '@/lib/wavecore/procurement-guard'

const DOC_TYPES = ['REQUISITION','PURCHASE_ORDER','SUPPLIER_INVOICE','PAYMENT_RUN','CONTRACT']
const APPROVER_ROLES = ['BUYER','APPROVER','FINANCE','ADMIN']

/**
 * GET /api/wavecore/procurement/approval-chains
 * Returns all chains + their steps for this org, grouped per chain.
 */
export const GET = procurementHandler(async (request: NextRequest) => {
  const g = await assertProcurement(request, 'READ')

  const chainsRes = await pool.query(
    `SELECT * FROM "ApprovalChain"
     WHERE "organizationId" = $1
     ORDER BY "documentType" ASC, priority DESC, COALESCE("minAmount", 0) ASC`,
    [g.organizationId]
  )
  const chainIds = chainsRes.rows.map((c: any) => c.id)

  let steps: any[] = []
  if (chainIds.length > 0) {
    const s = await pool.query(
      `SELECT * FROM "ApprovalStep"
       WHERE "organizationId" = $1 AND "chainId" = ANY($2::text[])
       ORDER BY "chainId", "stepNumber"`,
      [g.organizationId, chainIds]
    )
    steps = s.rows
  }

  const stepsByChain = new Map<string, any[]>()
  for (const s of steps) {
    const arr = stepsByChain.get(s.chainId) || []
    arr.push(s)
    stepsByChain.set(s.chainId, arr)
  }

  return NextResponse.json({
    chains: chainsRes.rows.map((c: any) => ({
      ...c,
      steps: stepsByChain.get(c.id) || [],
    })),
  })
})

/**
 * POST /api/wavecore/procurement/approval-chains
 * Body: {
 *   name*, documentType*, minAmount?, maxAmount?, currency?, priority?,
 *   isActive?, notes?,
 *   steps*: [{ stepNumber?, name?, approverRole?, approverUserId?,
 *              approverUserName?, isRequired?, slaHours?, notes? }]
 * }
 */
export const POST = procurementHandler(async (request: NextRequest) => {
  const g = await assertProcurement(request, 'WRITE')

  let body: any
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const name = String(body?.name || '').trim()
  if (!name) return NextResponse.json({ error: 'name required' }, { status: 400 })

  const documentType = String(body?.documentType || '').toUpperCase()
  if (!DOC_TYPES.includes(documentType)) {
    return NextResponse.json({ error: 'documentType must be one of ' + DOC_TYPES.join(' | ') }, { status: 400 })
  }

  const rawSteps = Array.isArray(body?.steps) ? body.steps : []
  if (rawSteps.length === 0) return NextResponse.json({ error: 'At least one step required' }, { status: 400 })
  if (rawSteps.length > 10) return NextResponse.json({ error: 'Max 10 steps' }, { status: 400 })

  const preparedSteps: any[] = []
  for (let i = 0; i < rawSteps.length; i++) {
    const s = rawSteps[i]
    const role = s?.approverRole ? String(s.approverRole).toUpperCase() : null
    if (role && !APPROVER_ROLES.includes(role)) {
      return NextResponse.json({ error: 'Step ' + (i+1) + ': approverRole must be ' + APPROVER_ROLES.join(' | ') }, { status: 400 })
    }
    preparedSteps.push({
      stepNumber: s?.stepNumber != null ? Number(s.stepNumber) : i + 1,
      name: s?.name || null,
      approverRole: role,
      approverUserId: s?.approverUserId || null,
      approverUserName: s?.approverUserName || null,
      isRequired: s?.isRequired !== false,
      slaHours: s?.slaHours != null ? Number(s.slaHours) : 48,
      notes: s?.notes || null,
    })
  }

  const crypto = require('crypto')
  const chainId = crypto.randomUUID()

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const ins = await client.query(
      `INSERT INTO "ApprovalChain"
         (id, "organizationId", name, "documentType",
          "minAmount", "maxAmount", currency, "isActive", priority,
          notes, "createdBy", "createdByName",
          "createdAt", "updatedAt")
       VALUES ($1,$2,$3,$4,
               $5,$6,$7,$8,$9,
               $10,$11,$12,
               NOW(),NOW())
       RETURNING *`,
      [
        chainId, g.organizationId, name, documentType,
        body?.minAmount != null ? Number(body.minAmount) : null,
        body?.maxAmount != null ? Number(body.maxAmount) : null,
        body?.currency || 'KES',
        body?.isActive !== false,
        body?.priority != null ? Number(body.priority) : 100,
        body?.notes || null,
        g.userId, g.userName,
      ]
    )

    const insertedSteps: any[] = []
    for (const s of preparedSteps) {
      const r = await client.query(
        `INSERT INTO "ApprovalStep"
           (id, "organizationId", "chainId", "stepNumber", name,
            "approverRole", "approverUserId", "approverUserName",
            "isRequired", "slaHours", notes,
            "createdAt", "updatedAt")
         VALUES ($1,$2,$3,$4,$5,
                 $6,$7,$8,
                 $9,$10,$11,
                 NOW(),NOW())
         RETURNING *`,
        [
          crypto.randomUUID(), g.organizationId, chainId, s.stepNumber, s.name,
          s.approverRole, s.approverUserId, s.approverUserName,
          s.isRequired, s.slaHours, s.notes,
        ]
      )
      insertedSteps.push(r.rows[0])
    }

    await client.query('COMMIT')

    await logProcurementEvent(pool, {
      organizationId: g.organizationId,
      eventType: 'APPROVAL_CHAIN_CREATED',
      entityType: 'ApprovalChain',
      entityId: chainId,
      actorId: g.userId,
      actorName: g.userName,
      summary: 'Created chain "' + name + '" for ' + documentType,
      metadata: { documentType, stepsCount: insertedSteps.length },
    })

    return NextResponse.json({ chain: { ...ins.rows[0], steps: insertedSteps } }, { status: 201 })
  } catch (err) {
    try { await client.query('ROLLBACK') } catch {}
    console.error('[approval-chain-create]', (err as Error).message)
    return NextResponse.json({ error: 'Create failed: ' + (err as Error).message }, { status: 500 })
  } finally {
    client.release()
  }
})

/**
 * PATCH /api/wavecore/procurement/approval-chains
 * Body: { id*, name?, minAmount?, maxAmount?, priority?, isActive?, notes? }
 * Updates only the chain header (steps unchanged).
 */
export const PATCH = procurementHandler(async (request: NextRequest) => {
  const g = await assertProcurement(request, 'WRITE')

  let body: any
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  const id = String(body?.id || '').trim()
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const editable: Record<string, string> = {
    name: 'name',
    minAmount: 'minAmount',
    maxAmount: 'maxAmount',
    priority: 'priority',
    isActive: 'isActive',
    notes: 'notes',
  }
  const sets: string[] = []
  const values: any[] = []
  for (const [k, col] of Object.entries(editable)) {
    if (k in body) {
      values.push(body[k] === '' ? null : body[k])
      sets.push(`"${col}" = $${values.length}`)
    }
  }
  if (sets.length === 0) return NextResponse.json({ error: 'No editable fields' }, { status: 400 })
  sets.push(`"updatedAt" = NOW()`)

  values.push(id); const idParam = values.length
  values.push(g.organizationId); const orgParam = values.length

  const upd = await pool.query(
    `UPDATE "ApprovalChain" SET ${sets.join(', ')}
     WHERE id = $${idParam} AND "organizationId" = $${orgParam}
     RETURNING *`,
    values
  )
  if (upd.rowCount === 0) return NextResponse.json({ error: 'Chain not found' }, { status: 404 })

  await logProcurementEvent(pool, {
    organizationId: g.organizationId,
    eventType: 'APPROVAL_CHAIN_UPDATED',
    entityType: 'ApprovalChain',
    entityId: id,
    actorId: g.userId,
    actorName: g.userName,
    summary: 'Updated chain header',
    metadata: { fields: Object.keys(body) },
  })

  return NextResponse.json({ chain: upd.rows[0] })
})

/**
 * DELETE /api/wavecore/procurement/approval-chains?id=...
 * Soft delete — sets isActive = FALSE.
 */
export const DELETE = procurementHandler(async (request: NextRequest) => {
  const g = await assertProcurement(request, 'WRITE')
  const { searchParams } = new URL(request.url)
  const id = String(searchParams.get('id') || '').trim()
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const upd = await pool.query(
    `UPDATE "ApprovalChain"
     SET "isActive" = FALSE, "updatedAt" = NOW()
     WHERE id = $1 AND "organizationId" = $2
     RETURNING *`,
    [id, g.organizationId]
  )
  if (upd.rowCount === 0) return NextResponse.json({ error: 'Chain not found' }, { status: 404 })

  await logProcurementEvent(pool, {
    organizationId: g.organizationId,
    eventType: 'APPROVAL_CHAIN_DEACTIVATED',
    entityType: 'ApprovalChain',
    entityId: id,
    actorId: g.userId,
    actorName: g.userName,
    summary: 'Deactivated chain',
  })

  return NextResponse.json({ ok: true, chain: upd.rows[0] })
})