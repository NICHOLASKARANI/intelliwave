export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/wavecore/auth'
import { pool } from '@/lib/wavecore/db'

async function ensureBatchesTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS "Batch" (
      id TEXT PRIMARY KEY,
      "batchNumber" TEXT NOT NULL,
      "lotNumber" TEXT,
      "productId" TEXT NOT NULL,
      "productName" TEXT,
      quantity DECIMAL(15,2) DEFAULT 0,
      "remainingQuantity" DECIMAL(15,2) DEFAULT 0,
      "manufacturingDate" TIMESTAMP,
      "expiryDate" TIMESTAMP,
      "supplierLot" TEXT,
      "countryOfOrigin" TEXT,
      "qualityStatus" TEXT DEFAULT 'PENDING',
      "warehouseId" TEXT,
      "warehouseName" TEXT,
      "binLocation" TEXT,
      "costPrice" DECIMAL(15,2) DEFAULT 0,
      "organizationId" TEXT NOT NULL,
      "createdAt" TIMESTAMP DEFAULT NOW(),
      "updatedAt" TIMESTAMP DEFAULT NOW(),
      UNIQUE("batchNumber", "productId", "organizationId")
    )
  `).catch(() => {})
  await pool.query(`CREATE INDEX IF NOT EXISTS "idx_batch_product" ON "Batch" ("productId")`).catch(() => {})
  await pool.query(`CREATE INDEX IF NOT EXISTS "idx_batch_expiry" ON "Batch" ("expiryDate")`).catch(() => {})
}

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await ensureBatchesTable()

    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('productId')
    const status = searchParams.get('status')
    const expiringDays = searchParams.get('expiringDays')

    let query = `SELECT * FROM "Batch" WHERE "organizationId" = $1`
    const params: any[] = [session.organizationId]
    let idx = 2

    if (productId) { query += ` AND "productId" = $${idx}`; params.push(productId); idx++ }
    if (status) { query += ` AND "qualityStatus" = $${idx}`; params.push(status); idx++ }
    if (expiringDays) { query += ` AND "expiryDate" <= NOW() + INTERVAL '${expiringDays} days'`; }

    query += ` ORDER BY "expiryDate" ASC NULLS LAST LIMIT 200`

    const result = await pool.query(query, params).catch(() => ({ rows: [] }))

    const summary = {
      total: result.rows.length,
      totalQuantity: result.rows.reduce((sum, b) => sum + Number(b.remainingQuantity || 0), 0),
      expiringSoon: result.rows.filter(b => b.expiryDate && new Date(b.expiryDate) <= new Date(Date.now() + 90*24*60*60*1000)).length,
      expired: result.rows.filter(b => b.expiryDate && new Date(b.expiryDate) < new Date()).length
    }

    return NextResponse.json({ batches: result.rows, summary })
  } catch (error) {
    return NextResponse.json({ batches: [], summary: { total: 0, totalQuantity: 0, expiringSoon: 0, expired: 0 } })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await ensureBatchesTable()

    const body = await request.json()
    const crypto = require('crypto')
    const id = crypto.randomUUID()

    const result = await pool.query(`
      INSERT INTO "Batch" (
        id, "batchNumber", "lotNumber", "productId", "productName",
        quantity, "remainingQuantity", "manufacturingDate", "expiryDate",
        "supplierLot", "countryOfOrigin", "qualityStatus",
        "warehouseId", "warehouseName", "binLocation", "costPrice",
        "organizationId", "createdAt", "updatedAt"
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, NOW(), NOW())
      RETURNING *
    `, [
      id, body.batchNumber, body.lotNumber, body.productId, body.productName,
      body.quantity || 0, body.remainingQuantity || body.quantity || 0,
      body.manufacturingDate, body.expiryDate, body.supplierLot, body.countryOfOrigin,
      body.qualityStatus || 'PENDING', body.warehouseId, body.warehouseName,
      body.binLocation, body.costPrice || 0, session.organizationId
    ])

    return NextResponse.json({ batch: result.rows[0] }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}