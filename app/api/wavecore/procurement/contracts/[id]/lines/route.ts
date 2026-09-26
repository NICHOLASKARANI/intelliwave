export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { assertProcurement, logProcurementEvent, procurementHandler } from '@/lib/wavecore/procurement-guard'

async function assertDraft(orgId: string, contractId: string) {
  const r = await pool.query(
    `SELECT status FROM "SupplierContract" WHERE id = $1 AND "organizationId" = $2`,
    [contractId, orgId]
  )
  if (r.rowCount === 0) return { ok: false, code: 404, error: 'Contract not found' }
  if (r.rows[0].status !== 'DRAFT') return { ok: false, code: 409, error: 'Lines can only be edited while DRAFT' }
  return { ok: true }
}

export const GET = procurementHandler(async (request: NextRequest, ctx: { params: { id: string } }) => {
  const g = await assertProcurement(request, 'READ')
  const r = await pool.query(
    `SELECT * FROM "SupplierContractLine"
     WHERE "contractId" = $1 AND "organizationId" = $2
     ORDER BY COALESCE("lineNumber", 9999) ASC`,
    [ctx.params.id, g.organizationId]
  )
  return NextResponse.json({ lines: r.rows })
})

export const POST = procurementHandler(async (request: NextRequest, ctx: { params: { id: string } }) => {
  const g = await assertProcurement(request, 'WRITE')
  const id = ctx.params.id

  const chk = await assertDraft(g.organizationId, id)
  if (!chk.ok) return NextResponse.json({ error: chk.error }, { status: chk.code })

  let body: any
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const desc = String(body?.description || '').trim()
  if (!desc) return NextResponse.json({ error: 'description required' }, { status: 400 })

  const qty = Number(body?.quantity) || 0
  const price = Number(body?.unitPrice) || 0
  const tax = Number(body?.taxRate) || 0
  const lineTotal = qty * price * (1 + tax / 100)

  const maxRes = await pool.query(
    `SELECT COALESCE(MAX("lineNumber"), 0)::int AS maxno
     FROM "SupplierContractLine" WHERE "contractId" = $1`,
    [id]
  )
  const nextNo = (maxRes.rows[0]?.maxno || 0) + 1
  const crypto = require('crypto')

  const ins = await pool.query(
    `INSERT INTO "SupplierContractLine"
       (id, "organizationId", "contractId", "lineNumber", description,
        quantity, "unitPrice", "taxRate", "lineTotal", "unitOfMeasure",
        notes, "createdAt", "updatedAt")
     VALUES ($1,$2,$3,$4,$5,
             $6,$7,$8,$9,$10,
             $11,NOW(),NOW())
     RETURNING *`,
    [
      crypto.randomUUID(), g.organizationId, id, nextNo, desc,
      qty, price, tax, lineTotal, body?.unitOfMeasure || 'UNIT',
      body?.notes || null,
    ]
  )

  await logProcurementEvent(pool, {
    organizationId: g.organizationId,
    eventType: 'SUPPLIER_CONTRACT_LINE_ADDED',
    entityType: 'SupplierContract',
    entityId: id,
    actorId: g.userId,
    actorName: g.userName,
    summary: 'Added line ' + nextNo,
    metadata: { lineId: ins.rows[0].id, lineTotal },
  })

  return NextResponse.json({ line: ins.rows[0] }, { status: 201 })
})