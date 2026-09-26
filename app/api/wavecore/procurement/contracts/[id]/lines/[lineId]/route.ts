export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { assertProcurement, logProcurementEvent, procurementHandler } from '@/lib/wavecore/procurement-guard'

async function assertDraftOwned(orgId: string, contractId: string, lineId: string) {
  const c = await pool.query(
    `SELECT status FROM "SupplierContract" WHERE id = $1 AND "organizationId" = $2`,
    [contractId, orgId]
  )
  if (c.rowCount === 0) return { ok: false, code: 404, error: 'Contract not found' }
  if (c.rows[0].status !== 'DRAFT') return { ok: false, code: 409, error: 'Lines can only be edited while DRAFT' }

  const l = await pool.query(
    `SELECT * FROM "SupplierContractLine"
     WHERE id = $1 AND "contractId" = $2 AND "organizationId" = $3`,
    [lineId, contractId, orgId]
  )
  if (l.rowCount === 0) return { ok: false, code: 404, error: 'Line not found' }
  return { ok: true, line: l.rows[0] }
}

export const PATCH = procurementHandler(async (request: NextRequest, ctx: { params: { id: string; lineId: string } }) => {
  const g = await assertProcurement(request, 'WRITE')
  const { id, lineId } = ctx.params
  const chk = await assertDraftOwned(g.organizationId, id, lineId)
  if (!chk.ok) return NextResponse.json({ error: chk.error }, { status: chk.code })
  const existing = chk.line

  let body: any
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const qty = 'quantity' in body ? Number(body.quantity) : Number(existing.quantity)
  const price = 'unitPrice' in body ? Number(body.unitPrice) : Number(existing.unitPrice)
  const tax = 'taxRate' in body ? Number(body.taxRate) : Number(existing.taxRate)
  const lineTotal = qty * price * (1 + tax / 100)

  const upd = await pool.query(
    `UPDATE "SupplierContractLine" SET
       description   = COALESCE($1, description),
       quantity      = $2,
       "unitPrice"   = $3,
       "taxRate"     = $4,
       "lineTotal"   = $5,
       "unitOfMeasure" = COALESCE($6, "unitOfMeasure"),
       notes         = COALESCE($7, notes),
       "updatedAt"   = NOW()
     WHERE id = $8 AND "contractId" = $9 AND "organizationId" = $10
     RETURNING *`,
    [
      body.description || null,
      qty, price, tax, lineTotal,
      body.unitOfMeasure || null,
      body.notes || null,
      lineId, id, g.organizationId,
    ]
  )

  await logProcurementEvent(pool, {
    organizationId: g.organizationId,
    eventType: 'SUPPLIER_CONTRACT_LINE_UPDATED',
    entityType: 'SupplierContract',
    entityId: id,
    actorId: g.userId,
    actorName: g.userName,
    summary: 'Updated line ' + existing.lineNumber,
    metadata: { lineId },
  })

  return NextResponse.json({ line: upd.rows[0] })
})

export const DELETE = procurementHandler(async (request: NextRequest, ctx: { params: { id: string; lineId: string } }) => {
  const g = await assertProcurement(request, 'WRITE')
  const { id, lineId } = ctx.params
  const chk = await assertDraftOwned(g.organizationId, id, lineId)
  if (!chk.ok) return NextResponse.json({ error: chk.error }, { status: chk.code })

  await pool.query(
    `DELETE FROM "SupplierContractLine"
     WHERE id = $1 AND "contractId" = $2 AND "organizationId" = $3`,
    [lineId, id, g.organizationId]
  )
  await logProcurementEvent(pool, {
    organizationId: g.organizationId,
    eventType: 'SUPPLIER_CONTRACT_LINE_REMOVED',
    entityType: 'SupplierContract',
    entityId: id,
    actorId: g.userId,
    actorName: g.userName,
    summary: 'Removed line ' + chk.line.lineNumber,
    metadata: { lineId },
  })
  return NextResponse.json({ ok: true })
})