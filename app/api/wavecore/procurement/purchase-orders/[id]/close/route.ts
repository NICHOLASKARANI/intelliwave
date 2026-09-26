export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { assertProcurement, logProcurementEvent, procurementHandler } from '@/lib/wavecore/procurement-guard'
import { canClose } from '@/lib/wavecore/procurement-po'

export const POST = procurementHandler(async (request: NextRequest, ctx: { params: { id: string } }) => {
  const g = await assertProcurement(request, 'WRITE')
  const id = ctx.params.id

  const poRes = await pool.query(
    `SELECT * FROM "PurchaseOrder" WHERE id = $1 AND "organizationId" = $2`,
    [id, g.organizationId]
  )
  if (poRes.rowCount === 0) return NextResponse.json({ error: 'Purchase order not found' }, { status: 404 })
  const po = poRes.rows[0]
  if (!canClose(po.status)) {
    return NextResponse.json({ error: 'This PO cannot be closed (current: ' + po.status + ')' }, { status: 409 })
  }

  const r = await pool.query(
    `UPDATE "PurchaseOrder"
     SET status = 'CLOSED', "closedAt" = NOW(), "closedBy" = $3, "updatedAt" = NOW()
     WHERE id = $1 AND "organizationId" = $2
     RETURNING *`,
    [id, g.organizationId, g.userId]
  )

  await logProcurementEvent(pool, {
    organizationId: g.organizationId,
    eventType: 'PURCHASE_ORDER_CLOSED',
    entityType: 'PurchaseOrder',
    entityId: id,
    actorId: g.userId,
    actorName: g.userName,
    summary: 'Closed PO ' + po.number,
  })

  return NextResponse.json({ purchaseOrder: r.rows[0] })
})