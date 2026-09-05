export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/wavecore/auth'
import { pool } from '@/lib/wavecore/db'

async function ensureCycleCountTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS "CycleCount" (
      id TEXT PRIMARY KEY,
      number TEXT UNIQUE,
      "productId" TEXT,
      "productName" TEXT,
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

    const result = await pool.query(`
      SELECT * FROM "CycleCount"
      WHERE "organizationId" = $1
      ORDER BY "createdAt" DESC
      LIMIT 100
    `, [session.organizationId]).catch(() => ({ rows: [] }))

    return NextResponse.json({ counts: result.rows })
  } catch (error) {
    console.error('Cycle Count GET error:', error)
    return NextResponse.json({ counts: [] })
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

    // Get current stock as expected quantity
    const stockResult = await pool.query(
      'SELECT COALESCE(quantity, 0) as qty FROM "StockQuantity" WHERE "productId" = $1 AND "organizationId" = $2',
      [body.productId, session.organizationId]
    ).catch(() => ({ rows: [{ qty: 0 }] }))

    const expectedQty = Number(stockResult.rows[0]?.qty || 0)
    const countedQty = Number(body.countedQuantity || 0)
    const variance = countedQty - expectedQty

    // Get product name
    const productResult = await pool.query(
      'SELECT name FROM "Product" WHERE id = $1 AND "organizationId" = $2',
      [body.productId, session.organizationId]
    ).catch(() => ({ rows: [] }))

    const productName = productResult.rows[0]?.name || 'N/A'

    const result = await pool.query(`
      INSERT INTO "CycleCount" (
        id, number, "productId", "productName",
        "expectedQuantity", "countedQuantity", "variance",
        status, "countedBy", "countDate", notes,
        "organizationId", "createdAt", "updatedAt"
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), $10, $11, NOW(), NOW())
      RETURNING *
    `, [
      id, number, body.productId, productName,
      expectedQty, countedQty, variance,
      body.status || 'COMPLETED', body.countedBy || '', body.notes || '',
      session.organizationId
    ])

    // If completed, update stock to counted quantity
    if ((body.status || 'COMPLETED') === 'COMPLETED') {
      await pool.query(`
        UPDATE "StockQuantity" SET quantity = $1, "availableQty" = $1, "updatedAt" = NOW()
        WHERE "productId" = $2 AND "organizationId" = $3
      `, [countedQty, body.productId, session.organizationId]).catch(() => {})
    }

    return NextResponse.json({ count: result.rows[0] }, { status: 201 })
  } catch (error) {
    console.error('Cycle Count POST error:', error)
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await ensureCycleCountTable()

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

    await pool.query('DELETE FROM "CycleCount" WHERE id = $1 AND "organizationId" = $2', [id, session.organizationId])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Cycle Count DELETE error:', error)
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
  }
}