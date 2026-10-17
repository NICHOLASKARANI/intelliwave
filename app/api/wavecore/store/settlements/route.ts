export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/wavecore/auth'
import { checkCsrf } from '@/lib/wavecore/csrf'
import { pool } from '@/lib/wavecore/db'

// Bootstrap locationId column (idempotent)
let _ensured = false
async function ensureSettlementSchema() {
  if (_ensured) return
  await pool.query(`ALTER TABLE "Settlement" ADD COLUMN IF NOT EXISTS "locationId" TEXT`).catch(() => {})
  _ensured = true
}

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await ensureSettlementSchema()

    const { searchParams } = new URL(request.url)
    const locationId = searchParams.get('locationId')
    const params: any[] = [session.organizationId]
    const locationWhere = locationId ? ' AND "locationId" = $2' : ''
    if (locationId) params.push(locationId)

    const result = await pool.query(
      `SELECT * FROM "Settlement" WHERE "organizationId" = $1${locationWhere} ORDER BY "createdAt" DESC LIMIT 100`,
      [session.organizationId]
    )

    return NextResponse.json({ settlements: result.rows })
  } catch (error) {
    return NextResponse.json({ settlements: [] })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const csrf = checkCsrf(request)
    if (!csrf.allow) return csrf.response!

    const body = await request.json()
    const crypto = require('crypto')
    const id = crypto.randomUUID()
    const number = 'STL-' + Date.now().toString().slice(-8)

    const result = await pool.query(
      `INSERT INTO "Settlement" (id, number, amount, method, status, "customerName", "organizationId", "locationId", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW()) RETURNING *`,
      [id, number, body.amount, body.method || 'MPESA', body.status || 'PENDING', body.customerName || '', session.organizationId, body.locationId || null]
    )

    return NextResponse.json({ settlement: result.rows[0] }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
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
    await pool.query(`DELETE FROM "Settlement" WHERE id = $1 AND "organizationId" = $2`, [id, session.organizationId])
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
  }
}
