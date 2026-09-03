export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/wavecore/auth'
import { pool } from '@/lib/wavecore/db'

async function ensureCycleCountTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS "CycleCount" (
      id TEXT PRIMARY KEY,
      number TEXT UNIQUE,
      "countType" TEXT DEFAULT 'CYCLE',
      "productId" TEXT,
      "productName" TEXT,
      "warehouseId" TEXT,
      "warehouseName" TEXT,
      "binLocation" TEXT,
      "expectedQuantity" DECIMAL(15,2) DEFAULT 0,
      "countedQuantity" DECIMAL(15,2),
      "variance" DECIMAL(15,2),
      status TEXT DEFAULT 'PENDING',
      "countedBy" TEXT,
      "countDate" TIMESTAMP,
      notes TEXT,
      "organizationId" TEXT NOT NULL,
      "createdAt" TIMESTAMP DEFAULT NOW(),
      "updatedAt" TIMESTAMP DEFAULT NOW()
    )
  `).catch(() => {})
  await pool.query(`CREATE INDEX IF NOT EXISTS "idx_cyclecount_org" ON "CycleCount" ("organizationId")`).catch(() => {})
}

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await ensureCycleCountTable()

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    let query = `SELECT * FROM "CycleCount" WHERE "organizationId" = $1`
    const params: any[] = [session.organizationId]
    if (status) { query += ` AND status = $2`; params.push(status) }
    query += ` ORDER BY "createdAt" DESC LIMIT 100`

    const result = await pool.query(query, params).catch(() => ({ rows: [] }))

    // Get products that should be counted (ABC priority)
    const countingSchedule = await pool.query(`
      SELECT 
        p.id, p.name, p.sku,
        COALESCE(sq.quantity, 0) as "currentStock",
        p."minStock", p."maxStock",
        CASE 
          WHEN COALESCE(sq.quantity, 0) = 0 THEN 'URGENT'
          WHEN COALESCE(sq.quantity, 0) < p."minStock" THEN 'HIGH'
          WHEN COALESCE(sq.quantity, 0) > p."maxStock" * 1.5 THEN 'MEDIUM'
          ELSE 'LOW'
        END as "countingPriority",
        CASE 
          WHEN COALESCE(sq.quantity, 0) = 0 THEN 'TODAY'
          WHEN COALESCE(sq.quantity, 0) < p."minStock" THEN 'THIS_WEEK'
          WHEN COALESCE(sq.quantity, 0) > p."maxStock" * 1.5 THEN 'THIS_MONTH'
          ELSE 'QUARTERLY'
        END as "suggestedDate"
      FROM "Product" p
      LEFT JOIN "StockQuantity" sq ON sq."productId" = p.id
      WHERE p."organizationId" = $1
      ORDER BY 
        CASE 
          WHEN COALESCE(sq.quantity, 0) = 0 THEN 0
          WHEN COALESCE(sq.quantity, 0) < p."minStock" THEN 1
          WHEN COALESCE(sq.quantity, 0) > p."maxStock" * 1.5 THEN 2
          ELSE 3
        END
      LIMIT 20
    `, [session.organizationId]).catch(() => ({ rows: [] }))

    const summary = {
      total: result.rows.length,
      pending: result.rows.filter(c => c.status === 'PENDING').length,
      completed: result.rows.filter(c => c.status === 'COMPLETED').length,
      withVariance: result.rows.filter(c => Math.abs(Number(c.variance || 0)) > 0).length
    }

    return NextResponse.json({ counts: result.rows, countingSchedule: countingSchedule.rows, summary })
  } catch (error) {
    return NextResponse.json({ counts: [], countingSchedule: [], summary: { total: 0, pending: 0, completed: 0, withVariance: 0 } })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await ensureCycleCountTable()

    const body = await request.json()
    const crypto = require('crypto')
    const id = crypto.randomUUID()
    const number = 'CNT-' + Date.now().toString().slice(-8)
    const expectedQty = Number(body.expectedQuantity || 0)
    const countedQty = Number(body.countedQuantity || 0)
    const variance = countedQty - expectedQty

    const result = await pool.query(`
      INSERT INTO "CycleCount" (
        id, number, "countType", "productId", "productName",
        "warehouseId", "warehouseName", "binLocation",
        "expectedQuantity", "countedQuantity", "variance",
        status, "countedBy", "countDate", notes,
        "organizationId", "createdAt", "updatedAt"
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW(), NOW())
      RETURNING *
    `, [
      id, number, body.countType || 'CYCLE', body.productId, body.productName,
      body.warehouseId, body.warehouseName, body.binLocation,
      expectedQty, countedQty, variance,
      body.status || 'PENDING', body.countedBy, body.countDate || new Date(),
      body.notes, session.organizationId
    ])

    return NextResponse.json({ count: result.rows[0] }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await ensureCycleCountTable()

    const body = await request.json()
    const countedQty = Number(body.countedQuantity || 0)
    const expectedQty = Number(body.expectedQuantity || 0)
    const variance = countedQty - expectedQty

    const result = await pool.query(`
      UPDATE "CycleCount" SET
        "countedQuantity" = $1,
        "variance" = $2,
        status = $3,
        "countedBy" = $4,
        "countDate" = NOW(),
        notes = $5,
        "updatedAt" = NOW()
      WHERE id = $6 AND "organizationId" = $7
      RETURNING *
    `, [countedQty, variance, body.status || 'COMPLETED', body.countedBy, body.notes, body.id, session.organizationId])

    if (result.rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ count: result.rows[0] })
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}