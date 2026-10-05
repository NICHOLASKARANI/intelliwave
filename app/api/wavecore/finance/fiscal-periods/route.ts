export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

/**
 * GET /api/wavecore/finance/fiscal-periods
 * Returns each fiscal year for this org with its periods nested.
 * Read-only. Tenant-scoped.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const orgId = session.organizationId

    const yearsRes = await pool.query(
      `SELECT id, name, "startDate", "endDate", "isClosed", "createdAt"
       FROM "FiscalYear"
       WHERE "organizationId" = $1
       ORDER BY "startDate" DESC`,
      [orgId]
    )

    const periodsRes = await pool.query(
      `SELECT p.id, p.name, p."startDate", p."endDate", p."isClosed", p."fiscalYearId",
              (SELECT COUNT(*)::int FROM "JournalEntry" je WHERE je."fiscalPeriodId" = p.id) AS "journalCount"
       FROM "FiscalPeriod" p
       JOIN "FiscalYear" y ON y.id = p."fiscalYearId"
       WHERE y."organizationId" = $1
       ORDER BY p."startDate" ASC`,
      [orgId]
    )

    const periodsByYear: Record<string, any[]> = {}
    for (const p of periodsRes.rows) {
      if (!periodsByYear[p.fiscalYearId]) periodsByYear[p.fiscalYearId] = []
      periodsByYear[p.fiscalYearId].push(p)
    }

    const years = yearsRes.rows.map((y: any) => ({
      ...y,
      periods: periodsByYear[y.id] || [],
    }))

    return NextResponse.json({ fiscalYears: years })
  } catch (error) {
    console.error('[fiscal-periods GET]', error)
    return NextResponse.json({ fiscalYears: [], error: 'Failed to load' }, { status: 500 })
  }
}

/**
 * POST /api/wavecore/finance/fiscal-periods
 * Body: { year: number, startMonth?: number (1-12, default 1) }
 * Creates a fiscal year and 12 monthly periods.
 * Idempotent-ish: rejects if a year with the same start date exists.
 */
export async function POST(request: NextRequest) {
  const client = await pool.connect()
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const orgId = session.organizationId

    const body = await request.json().catch(() => null)
    if (!body || !body.year) return NextResponse.json({ error: 'year is required' }, { status: 400 })

    const year = parseInt(body.year)
    if (isNaN(year) || year < 2000 || year > 2100) {
      return NextResponse.json({ error: 'Invalid year' }, { status: 400 })
    }
    const startMonth = parseInt(body.startMonth) || 1
    if (startMonth < 1 || startMonth > 12) return NextResponse.json({ error: 'Invalid startMonth' }, { status: 400 })

    const start = new Date(Date.UTC(year, startMonth - 1, 1))
    const end = new Date(Date.UTC(year + 1, startMonth - 1, 1))

    // Check for existing fiscal year with this start date
    const existing = await client.query(
      `SELECT id FROM "FiscalYear" WHERE "organizationId" = $1 AND "startDate" = $2`,
      [orgId, start]
    )
    if (existing.rowCount > 0) {
      return NextResponse.json({ error: 'A fiscal year starting on this date already exists' }, { status: 409 })
    }

    const crypto = require('crypto')
    const yearId = crypto.randomUUID()
    const name = 'FY ' + year + (startMonth !== 1 ? '/' + (year + 1) : '')

    await client.query('BEGIN')

    const yearRes = await client.query(
      `INSERT INTO "FiscalYear" (id, name, "startDate", "endDate", "isClosed", "organizationId", "createdAt")
       VALUES ($1, $2, $3, $4, FALSE, $5, NOW())
       RETURNING *`,
      [yearId, name, start, end, orgId]
    )

    // Generate 12 monthly periods
    const periods = []
    for (let i = 0; i < 12; i++) {
      const pStart = new Date(Date.UTC(year, startMonth - 1 + i, 1))
      const pEnd = new Date(Date.UTC(year, startMonth + i, 1))
      const pName = pStart.toLocaleDateString('en-GB', { month: 'short', year: 'numeric', timeZone: 'UTC' })
      const pId = crypto.randomUUID()
      await client.query(
        `INSERT INTO "FiscalPeriod" (id, name, "startDate", "endDate", "isClosed", "fiscalYearId", "createdAt")
         VALUES ($1, $2, $3, $4, FALSE, $5, NOW())`,
        [pId, pName, pStart, pEnd, yearId]
      )
      periods.push({ id: pId, name: pName, startDate: pStart, endDate: pEnd, isClosed: false })
    }

    await client.query('COMMIT')

    return NextResponse.json({ fiscalYear: { ...yearRes.rows[0], periods } }, { status: 201 })
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {})
    console.error('[fiscal-periods POST]', error)
    return NextResponse.json({ error: 'Failed to create fiscal year' }, { status: 500 })
  } finally {
    client.release()
  }
}