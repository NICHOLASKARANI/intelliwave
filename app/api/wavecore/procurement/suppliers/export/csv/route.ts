export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { assertProcurement } from '@/lib/wavecore/procurement-guard'

function csvEscape(v: any): string {
  if (v === null || v === undefined) return ''
  const s = String(v)
  if (/[",\n\r]/.test(s)) return '"' + s.replace(/"/g, '""') + '"'
  return s
}

export async function GET(request: NextRequest) {
  try {
    const g = await assertProcurement(request, 'EXPORT')
    const { searchParams } = new URL(request.url)
    const q = (searchParams.get('q') || '').trim()
    const status = searchParams.get('status')
    const category = searchParams.get('category')

    const where: string[] = ['"organizationId" = $1']
    const params: any[] = [g.organizationId]
    if (q) {
      params.push('%' + q + '%')
      where.push('("name" ILIKE $' + params.length + ' OR "legalName" ILIKE $' + params.length + ' OR "taxPin" ILIKE $' + params.length + ')')
    }
    if (status) { params.push(status); where.push('"status" = $' + params.length) }
    if (category) { params.push(category); where.push('"category" = $' + params.length) }

    const result = await pool.query(
      `SELECT id, name, "legalName", "tradingName", "registrationNumber", "taxPin",
              "vatStatus", country, county, city, address, "primaryEmail", "primaryPhone",
              email, phone, currency, "paymentTerms", "creditLimit", status,
              "isPreferred", "isBlacklisted", category, "riskLevel", "riskScore", rating,
              "createdAt"
       FROM "Supplier"
       WHERE ${where.join(' AND ')}
       ORDER BY "createdAt" DESC`,
      params
    )

    const headers = [
      'ID', 'Name', 'Legal Name', 'Trading Name', 'Registration #', 'Tax PIN',
      'VAT Status', 'Country', 'County', 'City', 'Address', 'Primary Email',
      'Primary Phone', 'Email', 'Phone', 'Currency', 'Payment Terms',
      'Credit Limit', 'Status', 'Preferred', 'Blacklisted', 'Category',
      'Risk Level', 'Risk Score', 'Rating', 'Created At',
    ]

    const lines = [headers.join(',')]
    for (const r of result.rows) {
      lines.push([
        csvEscape(r.id), csvEscape(r.name), csvEscape(r.legalName),
        csvEscape(r.tradingName), csvEscape(r.registrationNumber), csvEscape(r.taxPin),
        csvEscape(r.vatStatus), csvEscape(r.country), csvEscape(r.county),
        csvEscape(r.city), csvEscape(r.address), csvEscape(r.primaryEmail),
        csvEscape(r.primaryPhone), csvEscape(r.email), csvEscape(r.phone),
        csvEscape(r.currency), csvEscape(r.paymentTerms), csvEscape(r.creditLimit),
        csvEscape(r.status), csvEscape(r.isPreferred), csvEscape(r.isBlacklisted),
        csvEscape(r.category), csvEscape(r.riskLevel), csvEscape(r.riskScore),
        csvEscape(r.rating), csvEscape(r.createdAt),
      ].join(','))
    }

    const csv = lines.join('\n')
    const filename = 'suppliers-' + new Date().toISOString().slice(0, 10) + '.csv'

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="' + filename + '"',
        'Cache-Control': 'no-store',
      },
    })
  } catch (err) {
    if (err && (err as any).response) return (err as any).response
    console.error('[suppliers-export-csv]', err)
    return NextResponse.json({ error: 'Export failed' }, { status: 500 })
  }
}