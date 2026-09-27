export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { assertProcurement, logProcurementEvent, procurementHandler } from '@/lib/wavecore/procurement-guard'

async function assertDraft(orgId: string, rfqId: string) {
  const r = await pool.query(
    `SELECT status FROM "RFQ" WHERE id = $1 AND "organizationId" = $2`,
    [rfqId, orgId]
  )
  if (r.rowCount === 0) return { ok: false, code: 404, error: 'RFQ not found' }
  if (r.rows[0].status !== 'DRAFT') return { ok: false, code: 409, error: 'Lines can only be edited while DRAFT' }
  return { ok: true }
}

export const GET = procurementHandler(async (request: NextRequest, ctx: { params: { id: string } }) => {
  const g = await assertProcurement(request, 'READ')
  const r = await pool.query(
    `SELECT * FROM "RFQLine"
     WHERE "rfqId" = $1 AND "organizationId" = $2
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
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const desc = String(body?.description || '').trim()
  if (!desc) return NextResponse.json({ error: 'description required' }, { status: 400 })

  const maxRes = await pool.query(
    `SELECT COALESCE(MAX("lineNumber"), 0)::int AS maxno FROM "RFQLine" WHERE "rfqId" = $1`,
    [id]
  )
  const nextNo = (maxRes.rows[0]?.maxno || 0) + 1
  const crypto = require('crypto')

  const ins = await pool.query(
    `INSERT INTO "RFQLine"
       (id, "organizationId", "rfqId", "lineNumber", description,
        quantity, "unitOfMeasure", specifications, "targetPrice", notes,
        "createdAt", "updatedAt")
     VALUES ($1,$2,$3,$4,$5,
             $6,$7,$8,$9,$10,
             NOW(),NOW())
     RETURNING *`,
    [
      crypto.randomUUID(), g.organizationId, id, nextNo, desc,
      Number(body?.quantity) || 0, body?.unitOfMeasure || 'UNIT',
      body?.specifications || null, Number(body?.targetPrice) || 0,
      body?.notes || null,
    ]
  )

  await logProcurementEvent(pool, {
    organizationId: g.organizationId,
    eventType: 'RFQ_LINE_ADDED',
    entityType: 'RFQ',
    entityId: id,
    actorId: g.userId,
    actorName: g.userName,
    summary: 'Added line ' + nextNo,
    metadata: { lineId: ins.rows[0].id },
  })

  return NextResponse.json({ line: ins.rows[0] }, { status: 201 })
})