export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/wavecore/auth'
import { pool } from '@/lib/wavecore/db'

async function ensureApprovalTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS "InventoryApproval" (
      id TEXT PRIMARY KEY,
      number TEXT UNIQUE,
      "approvalType" TEXT NOT NULL,
      "entityType" TEXT,
      "entityId" TEXT,
      "requestedBy" TEXT,
      "requestedByName" TEXT,
      "requestedQuantity" DECIMAL(15,2),
      "requestedValue" DECIMAL(15,2),
      status TEXT DEFAULT 'PENDING',
      "approvedBy" TEXT,
      "approvedByName" TEXT,
      "approvalDate" TIMESTAMP,
      "rejectionReason" TEXT,
      notes TEXT,
      "organizationId" TEXT NOT NULL,
      "createdAt" TIMESTAMP DEFAULT NOW(),
      "updatedAt" TIMESTAMP DEFAULT NOW()
    )
  `).catch(() => {})
  await pool.query(`CREATE INDEX IF NOT EXISTS "idx_approval_org" ON "InventoryApproval" ("organizationId")`).catch(() => {})
}

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await ensureApprovalTable()

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    let query = `SELECT * FROM "InventoryApproval" WHERE "organizationId" = $1`
    const params: any[] = [session.organizationId]
    if (status) { query += ` AND status = $2`; params.push(status) }
    query += ` ORDER BY "createdAt" DESC LIMIT 100`

    const result = await pool.query(query, params).catch(() => ({ rows: [] }))

    const summary = {
      total: result.rows.length,
      pending: result.rows.filter(a => a.status === 'PENDING').length,
      approved: result.rows.filter(a => a.status === 'APPROVED').length,
      rejected: result.rows.filter(a => a.status === 'REJECTED').length,
      totalPendingValue: result.rows.filter(a => a.status === 'PENDING').reduce((s, a) => s + Number(a.requestedValue || 0), 0)
    }

    return NextResponse.json({ approvals: result.rows, summary })
  } catch (error) {
    return NextResponse.json({ approvals: [], summary: { total: 0, pending: 0, approved: 0, rejected: 0, totalPendingValue: 0 } })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await ensureApprovalTable()

    const body = await request.json()
    const crypto = require('crypto')
    const id = crypto.randomUUID()
    const number = 'APR-' + Date.now().toString().slice(-8)

    const result = await pool.query(`
      INSERT INTO "InventoryApproval" (
        id, number, "approvalType", "entityType", "entityId",
        "requestedBy", "requestedByName", "requestedQuantity", "requestedValue",
        status, notes, "organizationId", "createdAt", "updatedAt"
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
      RETURNING *
    `, [
      id, number, body.approvalType, body.entityType, body.entityId,
      body.requestedBy, body.requestedByName, body.requestedQuantity, body.requestedValue,
      body.status || 'PENDING', body.notes, session.organizationId
    ])

    return NextResponse.json({ approval: result.rows[0] }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await ensureApprovalTable()

    const body = await request.json()
    const result = await pool.query(`
      UPDATE "InventoryApproval" SET
        status = $1,
        "approvedBy" = $2,
        "approvedByName" = $3,
        "approvalDate" = CASE WHEN $1 IN ('APPROVED', 'REJECTED') THEN NOW() ELSE NULL END,
        "rejectionReason" = $4,
        notes = $5,
        "updatedAt" = NOW()
      WHERE id = $6 AND "organizationId" = $7
      RETURNING *
    `, [body.status, body.approvedBy, body.approvedByName, body.rejectionReason, body.notes, body.id, session.organizationId])

    if (result.rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ approval: result.rows[0] })
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}