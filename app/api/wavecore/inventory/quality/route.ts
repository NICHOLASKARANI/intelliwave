export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/wavecore/auth'
import { pool } from '@/lib/wavecore/db'

async function ensureQualityTables() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS "QualityCheck" (
      id TEXT PRIMARY KEY,
      number TEXT UNIQUE,
      "productId" TEXT,
      "productName" TEXT,
      "batchNumber" TEXT,
      "inspectionType" TEXT DEFAULT 'INCOMING',
      status TEXT DEFAULT 'PENDING',
      result TEXT,
      "inspectedBy" TEXT,
      "inspectionDate" TIMESTAMP,
      "sampleSize" INTEGER,
      "defectCount" INTEGER,
      "defectRate" DECIMAL(5,2),
      notes TEXT,
      "organizationId" TEXT NOT NULL,
      "createdAt" TIMESTAMP DEFAULT NOW(),
      "updatedAt" TIMESTAMP DEFAULT NOW()
    )
  `).catch(() => {})
  await pool.query(`CREATE INDEX IF NOT EXISTS "idx_quality_product" ON "QualityCheck" ("productId")`).catch(() => {})
}

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await ensureQualityTables()

    const result = await pool.query(`
      SELECT * FROM "QualityCheck"
      WHERE "organizationId" = $1
      ORDER BY "createdAt" DESC
      LIMIT 100
    `, [session.organizationId]).catch(() => ({ rows: [] }))

    const summary = {
      total: result.rows.length,
      pending: result.rows.filter(q => q.status === 'PENDING').length,
      passed: result.rows.filter(q => q.status === 'PASSED').length,
      failed: result.rows.filter(q => q.status === 'FAILED').length,
      quarantined: result.rows.filter(q => q.status === 'QUARANTINED').length
    }

    return NextResponse.json({ inspections: result.rows, summary })
  } catch (error) {
    return NextResponse.json({ inspections: [], summary: { total: 0, pending: 0, passed: 0, failed: 0, quarantined: 0 } })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await ensureQualityTables()

    const body = await request.json()
    const crypto = require('crypto')
    const id = crypto.randomUUID()
    const number = 'QC-' + Date.now().toString().slice(-8)

    const result = await pool.query(`
      INSERT INTO "QualityCheck" (
        id, number, "productId", "productName", "batchNumber",
        "inspectionType", status, result, "inspectedBy",
        "inspectionDate", "sampleSize", "defectCount", "defectRate",
        notes, "organizationId", "createdAt", "updatedAt"
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW(), NOW())
      RETURNING *
    `, [
      id, number, body.productId, body.productName, body.batchNumber,
      body.inspectionType || 'INCOMING', body.status || 'PENDING', body.result,
      body.inspectedBy, body.inspectionDate || new Date(),
      body.sampleSize, body.defectCount || 0,
      body.defectRate || 0, body.notes, session.organizationId
    ])

    return NextResponse.json({ inspection: result.rows[0] }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await ensureQualityTables()

    const body = await request.json()
    const result = await pool.query(`
      UPDATE "QualityCheck" SET
        status = $1,
        result = $2,
        "defectCount" = $3,
        "defectRate" = $4,
        notes = $5,
        "updatedAt" = NOW()
      WHERE id = $6 AND "organizationId" = $7
      RETURNING *
    `, [body.status, body.result, body.defectCount, body.defectRate, body.notes, body.id, session.organizationId])

    if (result.rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ inspection: result.rows[0] })
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}