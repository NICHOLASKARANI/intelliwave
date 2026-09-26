export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { assertProcurement, logProcurementEvent, procurementHandler } from '@/lib/wavecore/procurement-guard'

export const GET = procurementHandler(async (request: NextRequest, ctx: { params: { id: string } }) => {
  const g = await assertProcurement(request, 'READ')
  const r = await pool.query(
    `SELECT * FROM "SupplierBankAccount" WHERE "supplierId" = $1 AND "organizationId" = $2 ORDER BY "isPrimary" DESC, "createdAt" ASC`,
    [ctx.params.id, g.organizationId]
  )
  return NextResponse.json({ bankAccounts: r.rows })
})

export const POST = procurementHandler(async (request: NextRequest, ctx: { params: { id: string } }) => {
  const g = await assertProcurement(request, 'WRITE')

  const owner = await pool.query(
    `SELECT id FROM "Supplier" WHERE id = $1 AND "organizationId" = $2`,
    [ctx.params.id, g.organizationId]
  )
  if (owner.rowCount === 0) return NextResponse.json({ error: 'Supplier not found' }, { status: 404 })

  const body = await request.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  for (const k of ['bankName', 'accountName', 'accountNumber']) {
    if (!body[k]) return NextResponse.json({ error: k + ' is required' }, { status: 400 })
  }

  if (body.isPrimary) {
    await pool.query(
      `UPDATE "SupplierBankAccount" SET "isPrimary" = FALSE WHERE "supplierId" = $1 AND "organizationId" = $2`,
      [ctx.params.id, g.organizationId]
    )
  }

  const crypto = require('crypto')
  const id = crypto.randomUUID()

  const r = await pool.query(
    `INSERT INTO "SupplierBankAccount"
       (id, "organizationId", "supplierId", "bankName", "accountName", "accountNumber",
        "branchCode", "swiftCode", "currency", "isPrimary", "isVerified",
        "createdAt", "updatedAt")
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,FALSE,NOW(),NOW())
     RETURNING *`,
    [
      id, g.organizationId, ctx.params.id,
      body.bankName, body.accountName, body.accountNumber,
      body.branchCode || null, body.swiftCode || null,
      body.currency || 'KES', Boolean(body.isPrimary),
    ]
  )

  await logProcurementEvent(pool, {
    organizationId: g.organizationId,
    eventType: 'SUPPLIER_BANK_ADDED',
    entityType: 'Supplier',
    entityId: ctx.params.id,
    actorId: g.userId,
    actorName: g.userName,
    summary: 'Added bank account: ' + body.bankName + ' ending ' + String(body.accountNumber).slice(-4),
    metadata: { bankName: body.bankName },
  })

  return NextResponse.json({ bankAccount: r.rows[0] }, { status: 201 })
})