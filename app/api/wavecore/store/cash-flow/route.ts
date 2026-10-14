export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/wavecore/auth'
import { pool } from '@/lib/wavecore/db'
import { checkCsrf } from '@/lib/wavecore/csrf'

async function ensureCashFlowTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS "CashFlowEntry" (
      id               TEXT PRIMARY KEY,
      date             TIMESTAMP NOT NULL DEFAULT NOW(),
      description      TEXT NOT NULL,
      type             TEXT NOT NULL DEFAULT 'INCOME',
      amount           DOUBLE PRECISION NOT NULL DEFAULT 0,
      method           TEXT,
      reference        TEXT,
      "locationId"     TEXT,
      "organizationId" TEXT NOT NULL,
      "createdAt"      TIMESTAMP NOT NULL DEFAULT NOW(),
      "updatedAt"      TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `).catch(() => {})
  await pool.query(`CREATE INDEX IF NOT EXISTS "idx_cashflow_org" ON "CashFlowEntry" ("organizationId")`).catch(() => {})
  await pool.query(`CREATE INDEX IF NOT EXISTS "idx_cashflow_location" ON "CashFlowEntry" ("locationId")`).catch(() => {})
}

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await ensureCashFlowTable()

    const { searchParams } = new URL(request.url)
    const locationId = searchParams.get('locationId')

    const params: any[] = [session.organizationId]
    const locationWhere = locationId ? ' AND "locationId" = $2' : ''
    if (locationId) params.push(locationId)

    const result = await pool.query(
      `SELECT id, date, description, type, amount, method, reference, "locationId", "createdAt"
       FROM "CashFlowEntry"
       WHERE "organizationId" = $1${locationWhere}
       ORDER BY date DESC, "createdAt" DESC
       LIMIT 500`,
      params
    )

    const entries = result.rows.map((r: any) => ({
      id: r.id,
      date: r.date,
      description: r.description,
      type: r.type,
      amount: Number(r.amount || 0),
      method: r.method,
      reference: r.reference,
      locationId: r.locationId,
    }))

    return NextResponse.json({ entries })
  } catch (error) {
    console.error('[cash-flow GET]', error)
    return NextResponse.json({ entries: [], error: 'Failed to load' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const csrf = checkCsrf(request)
    if (!csrf.allow) return csrf.response!

    await ensureCashFlowTable()

    const body = await request.json()
    const description = String(body.description || '').trim()
    const amount = Number(body.amount || 0)
    const type = String(body.type || 'INCOME').toUpperCase()
    const method = body.method ? String(body.method) : null
    const reference = body.reference ? String(body.reference) : null
    const locationId = body.locationId ? String(body.locationId) : null
    const date = body.date ? new Date(body.date) : new Date()

    if (!description) return NextResponse.json({ error: 'Description required' }, { status: 400 })
    if (!Number.isFinite(amount) || amount <= 0) return NextResponse.json({ error: 'Amount must be > 0' }, { status: 400 })
    if (type !== 'INCOME' && type !== 'EXPENSE') return NextResponse.json({ error: 'Type must be INCOME or EXPENSE' }, { status: 400 })

    const crypto = require('crypto')
    const id = crypto.randomUUID()

    const result = await pool.query(
      `INSERT INTO "CashFlowEntry" (id, date, description, type, amount, method, reference, "locationId", "organizationId", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
       RETURNING id, date, description, type, amount, method, reference, "locationId"`,
      [id, date, description, type, amount, method, reference, locationId, session.organizationId]
    )

    return NextResponse.json({ entry: result.rows[0] }, { status: 201 })
  } catch (error) {
    console.error('[cash-flow POST]', error)
    return NextResponse.json({ error: 'Failed: ' + (error as Error).message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const csrf = checkCsrf(request)
    if (!csrf.allow) return csrf.response!

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    await ensureCashFlowTable()
    await pool.query('DELETE FROM "CashFlowEntry" WHERE id = $1 AND "organizationId" = $2', [id, session.organizationId])

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
  }
}