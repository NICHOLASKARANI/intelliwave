export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { assertProcurement, logProcurementEvent, procurementHandler } from '@/lib/wavecore/procurement-guard'

/**
 * POST /api/wavecore/procurement/approval-rules/seed
 * Body: { currency?: 'KES', force?: boolean }
 *
 * Seeds the default 4-tier approval chain:
 *   0–50k         → Step 1: DEPARTMENT_MANAGER
 *   50k–500k      → Step 1: DEPARTMENT_MANAGER, Step 2: FINANCE_MANAGER
 *   500k–5M       → Step 1: DEPARTMENT_MANAGER, Step 2: FINANCE_MANAGER, Step 3: CFO
 *   5M+           → Step 1: DEPARTMENT_MANAGER, Step 2: FINANCE_MANAGER, Step 3: CFO, Step 4: CEO
 *
 * Idempotent — skips rules with matching (name, appliesTo) already present.
 * Pass force=true to skip the idempotency check.
 */
export const POST = procurementHandler(async (request: NextRequest) => {
  const g = await assertProcurement(request, 'WRITE')

  let body: any = {}
  try { body = await request.json() } catch { /* allow empty body */ }

  const currency = body?.currency || 'KES'
  const force = Boolean(body?.force)

  const defaults = [
    { name: 'Requisition ≤ 50k — Dept Manager',           step: 1, min: 0,       max: 50000,    role: 'DEPARTMENT_MANAGER' },
    { name: 'Requisition 50k–500k — Step 1 Dept Manager',  step: 1, min: 50000,   max: 500000,   role: 'DEPARTMENT_MANAGER' },
    { name: 'Requisition 50k–500k — Step 2 Finance Manager', step: 2, min: 50000, max: 500000,   role: 'FINANCE_MANAGER' },
    { name: 'Requisition 500k–5M — Step 1 Dept Manager',   step: 1, min: 500000,  max: 5000000,  role: 'DEPARTMENT_MANAGER' },
    { name: 'Requisition 500k–5M — Step 2 Finance Manager', step: 2, min: 500000, max: 5000000,  role: 'FINANCE_MANAGER' },
    { name: 'Requisition 500k–5M — Step 3 CFO',            step: 3, min: 500000,  max: 5000000,  role: 'CFO' },
    { name: 'Requisition 5M+ — Step 1 Dept Manager',       step: 1, min: 5000000, max: null,     role: 'DEPARTMENT_MANAGER' },
    { name: 'Requisition 5M+ — Step 2 Finance Manager',    step: 2, min: 5000000, max: null,     role: 'FINANCE_MANAGER' },
    { name: 'Requisition 5M+ — Step 3 CFO',                step: 3, min: 5000000, max: null,     role: 'CFO' },
    { name: 'Requisition 5M+ — Step 4 CEO',                step: 4, min: 5000000, max: null,     role: 'CEO' },
  ]

  const crypto = require('crypto')
  let inserted = 0
  let skipped = 0

  for (const d of defaults) {
    if (!force) {
      const exists = await pool.query(
        `SELECT id FROM "ProcurementApprovalRule"
         WHERE "organizationId" = $1 AND "appliesTo" = 'REQUISITION' AND name = $2`,
        [g.organizationId, d.name]
      )
      if (exists.rowCount! > 0) { skipped++; continue }
    }

    const id = crypto.randomUUID()
    await pool.query(
      `INSERT INTO "ProcurementApprovalRule"
         (id, "organizationId", name, "appliesTo", "minAmount", "maxAmount",
          currency, "approverRole", "stepNumber", "isRequired", "slaHours",
          "isActive", "createdBy", "createdAt", "updatedAt")
       VALUES ($1,$2,$3,'REQUISITION',$4,$5,$6,$7,$8,TRUE,48,TRUE,$9,NOW(),NOW())`,
      [id, g.organizationId, d.name, d.min, d.max, currency, d.role, d.step, g.userId]
    )
    inserted++
  }

  await logProcurementEvent(pool, {
    organizationId: g.organizationId,
    eventType: 'PROCUREMENT_APPROVAL_RULES_SEEDED',
    entityType: 'ProcurementApprovalRule',
    entityId: 'seed:' + inserted,
    actorId: g.userId,
    actorName: g.userName,
    summary: 'Seeded ' + inserted + ' default approval rule(s)',
    metadata: { inserted, skipped, currency, force },
  })

  return NextResponse.json({ inserted, skipped })
})