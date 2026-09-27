export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { assertProcurement, procurementHandler } from '@/lib/wavecore/procurement-guard'
import { runBidAnalysis, EvaluationCriteria } from '@/lib/wavecore/procurement-bid-analysis'

/**
 * POST /api/wavecore/procurement/rfqs/[id]/analysis
 * Body (optional): { weights?: {...}, preferredSuppliers?: string[] }
 *
 * Overrides any evaluationCriteria stored on the RFQ. If omitted, uses
 * RFQ.evaluationCriteria. If that's also missing, DEFAULT_WEIGHTS apply.
 *
 * Runs the weighted scoring engine and returns the ranked suppliers +
 * recommendation. Does NOT write to the DB.
 */
export const POST = procurementHandler(async (request: NextRequest, ctx: { params: { id: string } }) => {
  const g = await assertProcurement(request, 'READ')
  const id = ctx.params.id

  let body: any = {}
  try { body = await request.json() } catch { /* body optional */ }

  const rfqRes = await pool.query(
    `SELECT * FROM "RFQ" WHERE id = $1 AND "organizationId" = $2`,
    [id, g.organizationId]
  )
  if (rfqRes.rowCount === 0) {
    return NextResponse.json({ error: 'RFQ not found' }, { status: 404 })
  }
  const rfq = rfqRes.rows[0]

  // Fetch lines, quotes, and suppliers
  const [linesRes, quotesRes] = await Promise.all([
    pool.query(
      `SELECT id, quantity FROM "RFQLine"
       WHERE "rfqId" = $1 AND "organizationId" = $2`,
      [id, g.organizationId]
    ),
    pool.query(
      `SELECT id, "supplierId", "rfqLineId", quantity, "unitPrice",
              "lineTotal", "leadTimeDays", status
       FROM "SupplierQuoteExt"
       WHERE "rfqId" = $1 AND "organizationId" = $2`,
      [id, g.organizationId]
    ),
  ])

  const supplierIds = Array.from(new Set(quotesRes.rows.map((q: any) => q.supplierId)))
  let suppliersById = new Map<string, any>()
  if (supplierIds.length > 0) {
    const s = await pool.query(
      `SELECT id, name, "legalName", rating FROM "Supplier"
       WHERE id = ANY($1::text[])`,
      [supplierIds]
    )
    for (const row of s.rows) suppliersById.set(row.id, row)
  }

  // Determine criteria: body overrides RFQ, RFQ overrides defaults
  let criteria: EvaluationCriteria = {}
  if (rfq.evaluationCriteria && typeof rfq.evaluationCriteria === 'object') {
    criteria = { ...criteria, ...(rfq.evaluationCriteria as any) }
  }
  if (body && typeof body === 'object') {
    if (body.weights) criteria.weights = { ...criteria.weights, ...body.weights }
    if (Array.isArray(body.preferredSuppliers)) criteria.preferredSuppliers = body.preferredSuppliers
  }

  const result = runBidAnalysis(
    linesRes.rows.map((r: any) => ({ id: r.id, quantity: Number(r.quantity) || 0 })),
    quotesRes.rows.map((r: any) => ({
      id: r.id,
      supplierId: r.supplierId,
      rfqLineId: r.rfqLineId,
      quantity: Number(r.quantity) || 0,
      unitPrice: Number(r.unitPrice) || 0,
      lineTotal: Number(r.lineTotal) || 0,
      leadTimeDays: r.leadTimeDays != null ? Number(r.leadTimeDays) : null,
      status: r.status,
    })),
    suppliersById,
    criteria
  )

  return NextResponse.json({
    rfqId: id,
    rfqNumber: rfq.rfqNumber,
    status: rfq.status,
    analysis: result,
  })
})