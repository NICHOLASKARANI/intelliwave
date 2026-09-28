export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { assertProcurement, logProcurementEvent, procurementHandler } from '@/lib/wavecore/procurement-guard'

async function ensureSettings(orgId: string) {
  const r = await pool.query(
    `SELECT * FROM "ProcurementSettings" WHERE "organizationId" = $1`,
    [orgId]
  )
  if (r.rowCount > 0) return r.rows[0]

  const crypto = require('crypto')
  const ins = await pool.query(
    `INSERT INTO "ProcurementSettings" (id, "organizationId", "createdAt", "updatedAt")
     VALUES ($1, $2, NOW(), NOW())
     RETURNING *`,
    [crypto.randomUUID(), orgId]
  )
  return ins.rows[0]
}

/**
 * GET /api/wavecore/procurement/settings
 * Returns this org's settings (auto-provisions if missing).
 */
export const GET = procurementHandler(async (request: NextRequest) => {
  const g = await assertProcurement(request, 'READ')
  const settings = await ensureSettings(g.organizationId)
  return NextResponse.json({ settings })
})

/**
 * PUT /api/wavecore/procurement/settings
 * Body: any subset of editable fields.
 */
export const PUT = procurementHandler(async (request: NextRequest) => {
  const g = await assertProcurement(request, 'WRITE')
  await ensureSettings(g.organizationId)

  let body: any
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const numFields = new Set([
    'defaultPaymentTerms','matchQtyTolerance','matchAmountTolerancePct',
    'matchAmountToleranceAbs','contractExpiryNoticeDays'
  ])
  const boolFields = new Set([
    'requireGRNBeforeInvoice','requireQualityInspection',
    'autoApproveMatchedInvoices','paymentRunRequireApproval'
  ])
  const strFields = new Set([
    'defaultCurrency','poNumberPrefix','grnNumberPrefix','invoiceNumberPrefix','notes'
  ])

  const sets: string[] = []
  const values: any[] = []
  for (const [k, v] of Object.entries(body)) {
    if (numFields.has(k)) {
      const n = Number(v)
      if (!Number.isFinite(n) || n < 0) {
        return NextResponse.json({ error: k + ' must be a non-negative number' }, { status: 400 })
      }
      values.push(n); sets.push(`"${k}" = $${values.length}`)
    } else if (boolFields.has(k)) {
      values.push(Boolean(v)); sets.push(`"${k}" = $${values.length}`)
    } else if (strFields.has(k)) {
      values.push(v == null ? null : String(v)); sets.push(`"${k}" = $${values.length}`)
    }
  }
  if (sets.length === 0) return NextResponse.json({ error: 'No editable fields' }, { status: 400 })
  sets.push(`"updatedAt" = NOW()`)

  values.push(g.organizationId)
  const orgParam = values.length

  const upd = await pool.query(
    `UPDATE "ProcurementSettings" SET ${sets.join(', ')}
     WHERE "organizationId" = $${orgParam}
     RETURNING *`,
    values
  )

  await logProcurementEvent(pool, {
    organizationId: g.organizationId,
    eventType: 'PROCUREMENT_SETTINGS_UPDATED',
    entityType: 'ProcurementSettings',
    entityId: upd.rows[0].id,
    actorId: g.userId,
    actorName: g.userName,
    summary: 'Updated procurement settings',
    metadata: { fields: Object.keys(body) },
  })

  return NextResponse.json({ settings: upd.rows[0] })
})