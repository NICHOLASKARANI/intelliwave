export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

// GET /api/wavecore/currency/rate?from=USD&to=KES&date=YYYY-MM-DD
//
// Returns the ExchangeRate row for the requested pair on/before the given date.
// Prefers org-scoped rates over global (organizationId IS NULL) rates.
// For from === to, returns rate 1 without a DB query.
export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const from = (searchParams.get('from') || 'KES').toUpperCase()
    const to = (searchParams.get('to') || 'KES').toUpperCase()
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0]

    if (from === to) {
      return NextResponse.json({ from, to, rate: 1, effectiveDate: date, source: 'same' })
    }

    const result = await pool.query(
      `SELECT "fromCurrency", "toCurrency", rate, "effectiveDate", source, "organizationId"
       FROM "ExchangeRate"
       WHERE "fromCurrency" = $1
         AND "toCurrency" = $2
         AND "effectiveDate" <= $3
         AND ("organizationId" IS NULL OR "organizationId" = $4)
       ORDER BY
         CASE WHEN "organizationId" = $4 THEN 0 ELSE 1 END ASC,
         "effectiveDate" DESC,
         "createdAt" DESC
       LIMIT 1`,
      [from, to, date, session.organizationId]
    )

    if (result.rowCount === 0) {
      return NextResponse.json({
        from, to, rate: 1, effectiveDate: date,
        source: 'fallback',
        warning: `No exchange rate configured for ${from} to ${to} on/before ${date}. Invoice will post at 1:1.`,
      })
    }

    const row = result.rows[0]
    return NextResponse.json({
      from: row.fromCurrency,
      to: row.toCurrency,
      rate: Number(row.rate),
      effectiveDate: row.effectiveDate,
      source: row.effectiveDate === date ? 'exact' : 'latest',
    })
  } catch (error) {
    console.error('Currency rate GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch rate' }, { status: 500 })
  }
}
