export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

const sum = (arr: any[], key: string) => arr.reduce((s, x) => s + Number(x[key] || 0), 0)

/**
 * GET /api/wavecore/finance/reports/vat-return?from=&to=
 *
 * Kenya VAT return summary.
 *   Output VAT = SUM(CustomerInvoice.taxAmount)   (sales side)
 *   Input VAT  = SUM(SupplierInvoice.taxAmount)   (purchase side)
 *   Net VAT    = Output - Input
 *                 positive → VAT payable to KRA
 *                 negative → VAT refundable
 *
 * Excludes CANCELLED and DRAFT invoices. Read-only. Tenant-scoped.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const orgId = session.organizationId

    const { searchParams } = new URL(request.url)
    const from = searchParams.get('from')
    const to = searchParams.get('to')

    // Customer (output) side
    let custSql = `
      SELECT ci.id, ci.number, ci.date, ci.status, ci.subtotal, ci."taxAmount" AS "taxAmount", ci.total,
             c.name AS "customerName"
      FROM "CustomerInvoice" ci
      LEFT JOIN "Customer" c ON c.id = ci."customerId"
      WHERE ci."organizationId" = $1
        AND ci.status NOT IN ('CANCELLED','DRAFT')
    `
    const custParams: any[] = [orgId]
    let idx = 2
    if (from) { custSql += ` AND ci.date >= $${idx++}`; custParams.push(from) }
    if (to)   { custSql += ` AND ci.date <= $${idx++}`; custParams.push(to) }
    custSql += ` ORDER BY ci.date ASC`

    const custRes = await pool.query(custSql, custParams)

    // Supplier (input) side
    let suppSql = `
      SELECT si.id, si."invoiceNumber" AS "invoiceNumber", si."invoiceDate" AS "invoiceDate",
             si.status, si.subtotal, si."taxAmount" AS "taxAmount", si.total,
             si."supplierName" AS "supplierName"
      FROM "SupplierInvoice" si
      WHERE si."organizationId" = $1
        AND si.status NOT IN ('CANCELLED','DRAFT','REJECTED')
    `
    const suppParams: any[] = [orgId]
    let sidx = 2
    if (from) { suppSql += ` AND si."invoiceDate" >= $${sidx++}`; suppParams.push(from) }
    if (to)   { suppSql += ` AND si."invoiceDate" <= $${sidx++}`; suppParams.push(to) }
    suppSql += ` ORDER BY si."invoiceDate" ASC`

    const suppRes = await pool.query(suppSql, suppParams)

    const outputRows = custRes.rows.map((r: any) => ({
      id: r.id,
      number: r.number,
      date: r.date,
      status: r.status,
      party: r.customerName || '—',
      subtotal: Number(r.subtotal || 0),
      vat: Number(r.taxAmount || 0),
      total: Number(r.total || 0),
    }))

    const inputRows = suppRes.rows.map((r: any) => ({
      id: r.id,
      number: r.invoiceNumber,
      date: r.invoiceDate,
      status: r.status,
      party: r.supplierName || '—',
      subtotal: Number(r.subtotal || 0),
      vat: Number(r.taxAmount || 0),
      total: Number(r.total || 0),
    }))

    const outputVat = sum(outputRows, 'vat')
    const inputVat  = sum(inputRows, 'vat')
    const netVat = Math.round((outputVat - inputVat) * 100) / 100

    const totalSales = sum(outputRows, 'subtotal')
    const totalPurchases = sum(inputRows, 'subtotal')

    return NextResponse.json({
      from: from || null,
      to: to || null,
      outputVat: Math.round(outputVat * 100) / 100,
      inputVat: Math.round(inputVat * 100) / 100,
      netVat,
      payable: netVat > 0,
      refundable: netVat < 0,
      totalSales: Math.round(totalSales * 100) / 100,
      totalPurchases: Math.round(totalPurchases * 100) / 100,
      outputRows,
      inputRows,
      outputCount: outputRows.length,
      inputCount: inputRows.length,
      generatedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[vat-return]', error)
    return NextResponse.json({
      outputVat: 0, inputVat: 0, netVat: 0, payable: false, refundable: false,
      outputRows: [], inputRows: [], error: 'Failed to load',
    }, { status: 500 })
  }
}