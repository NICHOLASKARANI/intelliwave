export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { assertProcurement, logProcurementEvent, procurementHandler } from '@/lib/wavecore/procurement-guard'

async function verifySupplierInOrg(supplierId: string, organizationId: string) {
  const r = await pool.query(
    `SELECT id FROM "Supplier" WHERE id = $1 AND "organizationId" = $2`,
    [supplierId, organizationId]
  )
  return r.rowCount! > 0
}

// GET /suppliers/[id] — full 360 view with all nested collections
export const GET = procurementHandler(async (request: NextRequest, ctx: { params: { id: string } }) => {
  const g = await assertProcurement(request, 'READ')

  const id = ctx.params.id
  const orgId = g.organizationId

  const supplierRes = await pool.query(
    `SELECT * FROM "Supplier" WHERE id = $1 AND "organizationId" = $2`,
    [id, orgId]
  )
  if (supplierRes.rowCount === 0) {
    return NextResponse.json({ error: 'Supplier not found' }, { status: 404 })
  }

  const [
    contactsRes,
    bankRes,
    docsRes,
    scorecardsRes,
    risksRes,
    poRes,
    quotesRes,
    eventsRes,
  ] = await Promise.all([
    pool.query(
      `SELECT * FROM "SupplierContact" WHERE "supplierId" = $1 AND "organizationId" = $2 ORDER BY "isPrimary" DESC, "createdAt" ASC`,
      [id, orgId]
    ),
    pool.query(
      `SELECT * FROM "SupplierBankAccount" WHERE "supplierId" = $1 AND "organizationId" = $2 ORDER BY "isPrimary" DESC, "createdAt" ASC`,
      [id, orgId]
    ),
    pool.query(
      `SELECT * FROM "SupplierDocument" WHERE "supplierId" = $1 AND "organizationId" = $2 ORDER BY "createdAt" DESC`,
      [id, orgId]
    ),
    pool.query(
      `SELECT * FROM "SupplierScorecard" WHERE "supplierId" = $1 AND "organizationId" = $2 ORDER BY "periodEnd" DESC LIMIT 12`,
      [id, orgId]
    ),
    pool.query(
      `SELECT * FROM "SupplierRisk" WHERE "supplierId" = $1 AND "organizationId" = $2 ORDER BY "detectedAt" DESC`,
      [id, orgId]
    ),
    pool.query(
      `SELECT id, "number", "date", "status", "total", "amount", "currency" FROM "PurchaseOrder"
       WHERE "supplierId" = $1 AND "organizationId" = $2
       ORDER BY "createdAt" DESC LIMIT 20`,
      [id, orgId]
    ),
    pool.query(
      `SELECT id, "supplierName", "amount", "status", "currency", "createdAt"
       FROM "SupplierQuote" WHERE "supplierId" = $1 AND "organizationId" = $2
       ORDER BY "createdAt" DESC LIMIT 20`,
      [id, orgId]
    ),
    pool.query(
      `SELECT id, "eventType", "summary", "actorName", "createdAt"
       FROM "ProcurementEvent"
       WHERE "entityType" = 'Supplier' AND "entityId" = $1 AND "organizationId" = $2
       ORDER BY "createdAt" DESC LIMIT 30`,
      [id, orgId]
    ),
  ])

  // Aggregate totals for the supplier
  const totalsRes = await pool.query(
    `SELECT
       COALESCE(SUM(COALESCE("total", "amount", 0)), 0)::float AS lifetime_spend,
       COUNT(*)::int AS po_count
     FROM "PurchaseOrder"
     WHERE "supplierId" = $1 AND "organizationId" = $2`,
    [id, orgId]
  )

  return NextResponse.json({
    supplier: supplierRes.rows[0],
    contacts: contactsRes.rows,
    bankAccounts: bankRes.rows,
    documents: docsRes.rows,
    scorecards: scorecardsRes.rows,
    risks: risksRes.rows,
    purchaseOrders: poRes.rows,
    quotations: quotesRes.rows,
    activity: eventsRes.rows,
    metrics: totalsRes.rows[0] || { lifetime_spend: 0, po_count: 0 },
  })
})

// PATCH /suppliers/[id] — update supplier fields
export const PATCH = procurementHandler(async (request: NextRequest, ctx: { params: { id: string } }) => {
  const g = await assertProcurement(request, 'WRITE')

  const id = ctx.params.id
  const orgId = g.organizationId

  if (!(await verifySupplierInOrg(id, orgId))) {
    return NextResponse.json({ error: 'Supplier not found' }, { status: 404 })
  }

  let body: any
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  // Whitelist of updatable columns — prevents mass-assignment
  const updatable: Record<string, string> = {
    name: 'name',
    legalName: 'legalName',
    tradingName: 'tradingName',
    registrationNumber: 'registrationNumber',
    taxPin: 'taxPin',
    vatStatus: 'vatStatus',
    country: 'country',
    county: 'county',
    address: 'address',
    city: 'city',
    postalCode: 'postalCode',
    website: 'website',
    primaryEmail: 'primaryEmail',
    primaryPhone: 'primaryPhone',
    email: 'email',
    phone: 'phone',
    currency: 'currency',
    paymentTerms: 'paymentTerms',
    creditLimit: 'creditLimit',
    status: 'status',
    isPreferred: 'isPreferred',
    isBlacklisted: 'isBlacklisted',
    blacklistReason: 'blacklistReason',
    category: 'category',
    notes: 'notes',
  }

  const sets: string[] = []
  const params: any[] = []
  const changes: Record<string, { from: any; to: any }> = {}

  for (const [key, col] of Object.entries(updatable)) {
    if (key in body) {
      params.push(body[key])
      sets.push(`"${col}" = $${params.length}`)
      changes[key] = { from: null, to: body[key] }
    }
  }

  if (sets.length === 0) {
    return NextResponse.json({ error: 'No updatable fields provided' }, { status: 400 })
  }

  params.push(g.userId)
  sets.push(`"updatedBy" = $${params.length}`)

  params.push(id, orgId)
  const whereStart = params.length - 1

  const result = await pool.query(
    `UPDATE "Supplier" SET ${sets.join(', ')}, "updatedAt" = NOW()
     WHERE id = $${whereStart} AND "organizationId" = $${whereStart + 1}
     RETURNING *`,
    params
  )

  await logProcurementEvent(pool, {
    organizationId: orgId,
    eventType: 'SUPPLIER_UPDATED',
    entityType: 'Supplier',
    entityId: id,
    actorId: g.userId,
    actorName: g.userName,
    summary: 'Updated supplier: ' + (result.rows[0]?.name || id),
    metadata: { fields: Object.keys(changes) },
  })

  return NextResponse.json({ supplier: result.rows[0] })
})

// DELETE /suppliers/[id] — soft-delete by default; hard delete if ?mode=hard and tier>=4
export const DELETE = procurementHandler(async (request: NextRequest, ctx: { params: { id: string } }) => {
  const g = await assertProcurement(request, 'DELETE')

  const id = ctx.params.id
  const orgId = g.organizationId
  const { searchParams } = new URL(request.url)
  const mode = searchParams.get('mode') || 'soft'

  if (!(await verifySupplierInOrg(id, orgId))) {
    return NextResponse.json({ error: 'Supplier not found' }, { status: 404 })
  }

  if (mode === 'hard') {
    // Safety: refuse if referenced by any PO / Quote / Contract
    const refs = await pool.query(
      `SELECT
         (SELECT COUNT(*) FROM "PurchaseOrder" WHERE "supplierId" = $1)::int AS po_count,
         (SELECT COUNT(*) FROM "SupplierQuote" WHERE "supplierId" = $1)::int AS quote_count,
         (SELECT COUNT(*) FROM "Contract"      WHERE "supplierId" = $1)::int AS contract_count`,
      [id]
    )
    const r = refs.rows[0]
    if ((r.po_count + r.quote_count + r.contract_count) > 0) {
      return NextResponse.json(
        { error: 'Cannot hard-delete: supplier is referenced by existing records', refs: r },
        { status: 409 }
      )
    }
    await pool.query(`DELETE FROM "Supplier" WHERE id = $1 AND "organizationId" = $2`, [id, orgId])
    await logProcurementEvent(pool, {
      organizationId: orgId,
      eventType: 'SUPPLIER_HARD_DELETED',
      entityType: 'Supplier',
      entityId: id,
      actorId: g.userId,
      actorName: g.userName,
      summary: 'Hard-deleted supplier: ' + id,
    })
    return NextResponse.json({ success: true, mode: 'hard' })
  }

  // Soft delete → status = INACTIVE
  const result = await pool.query(
    `UPDATE "Supplier" SET "status" = 'INACTIVE', "updatedAt" = NOW()
     WHERE id = $1 AND "organizationId" = $2 RETURNING *`,
    [id, orgId]
  )
  await logProcurementEvent(pool, {
    organizationId: orgId,
    eventType: 'SUPPLIER_SOFT_DELETED',
    entityType: 'Supplier',
    entityId: id,
    actorId: g.userId,
    actorName: g.userName,
    summary: 'Deactivated supplier: ' + (result.rows[0]?.name || id),
  })
  return NextResponse.json({ success: true, mode: 'soft', supplier: result.rows[0] })
})