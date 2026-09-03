export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/wavecore/auth'
import { pool } from '@/lib/wavecore/db'

async function ensureAuditTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS "InventoryAudit" (
      id TEXT PRIMARY KEY,
      "entityType" TEXT NOT NULL,
      "entityId" TEXT,
      "action" TEXT NOT NULL,
      "fieldName" TEXT,
      "oldValue" TEXT,
      "newValue" TEXT,
      "userId" TEXT,
      "userName" TEXT,
      "ipAddress" TEXT,
      "userAgent" TEXT,
      notes TEXT,
      "organizationId" TEXT NOT NULL,
      "createdAt" TIMESTAMP DEFAULT NOW()
    )
  `).catch(() => {})
  await pool.query(`CREATE INDEX IF NOT EXISTS "idx_audit_org" ON "InventoryAudit" ("organizationId")`).catch(() => {})
  await pool.query(`CREATE INDEX IF NOT EXISTS "idx_audit_entity" ON "InventoryAudit" ("entityType", "entityId")`).catch(() => {})
}

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await ensureAuditTable()

    const { searchParams } = new URL(request.url)
    const entityType = searchParams.get('entityType')
    const entityId = searchParams.get('entityId')
    const action = searchParams.get('action')
    const limit = parseInt(searchParams.get('limit') || '100')

    let query = `SELECT * FROM "InventoryAudit" WHERE "organizationId" = $1`
    const params: any[] = [session.organizationId]
    let idx = 2
    if (entityType) { query += ` AND "entityType" = $${idx}`; params.push(entityType); idx++ }
    if (entityId) { query += ` AND "entityId" = $${idx}`; params.push(entityId); idx++ }
    if (action) { query += ` AND "action" = $${idx}`; params.push(action); idx++ }
    query += ` ORDER BY "createdAt" DESC LIMIT $${idx}`
    params.push(limit)

    const result = await pool.query(query, params).catch(() => ({ rows: [] }))

    return NextResponse.json({ audit: result.rows })
  } catch (error) {
    return NextResponse.json({ audit: [] })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await ensureAuditTable()

    const body = await request.json()
    const crypto = require('crypto')
    const id = crypto.randomUUID()

    const result = await pool.query(`
      INSERT INTO "InventoryAudit" (
        id, "entityType", "entityId", "action", "fieldName",
        "oldValue", "newValue", "userId", "userName",
        "ipAddress", "userAgent", notes, "organizationId", "createdAt"
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW())
      RETURNING *
    `, [
      id, body.entityType, body.entityId, body.action, body.fieldName,
      body.oldValue, body.newValue, body.userId, body.userName,
      body.ipAddress, body.userAgent, body.notes, session.organizationId
    ])

    return NextResponse.json({ audit: result.rows[0] }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}