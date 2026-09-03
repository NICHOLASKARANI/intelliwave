export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/wavecore/auth'
import { pool } from '@/lib/wavecore/db'

// Ensure InventoryLedger table exists
async function ensureLedgerTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS "InventoryLedger" (
      id TEXT PRIMARY KEY,
      "transactionId" TEXT NOT NULL,
      "productId" TEXT,
      "productName" TEXT,
      "warehouseId" TEXT,
      "warehouseName" TEXT,
      "binLocation" TEXT,
      quantity DECIMAL(15,2) NOT NULL DEFAULT 0,
      "beforeQuantity" DECIMAL(15,2) DEFAULT 0,
      "afterQuantity" DECIMAL(15,2) DEFAULT 0,
      "transactionType" TEXT NOT NULL,
      "stockState" TEXT DEFAULT 'AVAILABLE',
      "costPrice" DECIMAL(15,2) DEFAULT 0,
      "sellingPrice" DECIMAL(15,2) DEFAULT 0,
      "batchNumber" TEXT,
      "serialNumber" TEXT,
      "expiryDate" TIMESTAMP,
      "sourceDocument" TEXT,
      "referenceNumber" TEXT,
      "userId" TEXT,
      "userName" TEXT,
      "notes" TEXT,
      "organizationId" TEXT NOT NULL,
      "createdAt" TIMESTAMP DEFAULT NOW()
    )
  `).catch(() => {})
  
  await pool.query(`CREATE INDEX IF NOT EXISTS "idx_ledger_org" ON "InventoryLedger" ("organizationId")`).catch(() => {})
  await pool.query(`CREATE INDEX IF NOT EXISTS "idx_ledger_product" ON "InventoryLedger" ("productId")`).catch(() => {})
  await pool.query(`CREATE INDEX IF NOT EXISTS "idx_ledger_created" ON "InventoryLedger" ("createdAt" DESC)`).catch(() => {})
}

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await ensureLedgerTable()

    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('productId')
    const warehouseId = searchParams.get('warehouseId')
    const transactionType = searchParams.get('type')
    const limit = parseInt(searchParams.get('limit') || '100')
    
    let query = `SELECT * FROM "InventoryLedger" WHERE "organizationId" = $1`
    const params: any[] = [session.organizationId]
    let paramIndex = 2
    
    if (productId) {
      query += ` AND "productId" = $${paramIndex}`
      params.push(productId)
      paramIndex++
    }
    if (warehouseId) {
      query += ` AND "warehouseId" = $${paramIndex}`
      params.push(warehouseId)
      paramIndex++
    }
    if (transactionType) {
      query += ` AND "transactionType" = $${paramIndex}`
      params.push(transactionType)
      paramIndex++
    }
    
    query += ` ORDER BY "createdAt" DESC LIMIT $${paramIndex}`
    params.push(limit)

    const result = await pool.query(query, params)
    return NextResponse.json({ ledger: result.rows })
  } catch (error) {
    console.error('Ledger GET error:', error)
    return NextResponse.json({ ledger: [] })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await ensureLedgerTable()

    const body = await request.json()
    const crypto = require('crypto')
    const id = crypto.randomUUID()
    const transactionId = body.transactionId || 'TXN-' + Date.now().toString()

    const result = await pool.query(`
      INSERT INTO "InventoryLedger" (
        id, "transactionId", "productId", "productName", "warehouseId", "warehouseName",
        "binLocation", quantity, "beforeQuantity", "afterQuantity", "transactionType",
        "stockState", "costPrice", "sellingPrice", "batchNumber", "serialNumber",
        "expiryDate", "sourceDocument", "referenceNumber", "userId", "userName",
        notes, "organizationId"
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23)
      RETURNING *
    `, [
      id, transactionId, body.productId, body.productName, body.warehouseId, body.warehouseName,
      body.binLocation, body.quantity, body.beforeQuantity, body.afterQuantity, body.transactionType,
      body.stockState || 'AVAILABLE', body.costPrice || 0, body.sellingPrice || 0,
      body.batchNumber, body.serialNumber, body.expiryDate, body.sourceDocument,
      body.referenceNumber, body.userId, body.userName, body.notes, session.organizationId
    ])

    return NextResponse.json({ ledger: result.rows[0] }, { status: 201 })
  } catch (error) {
    console.error('Ledger POST error:', error)
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}