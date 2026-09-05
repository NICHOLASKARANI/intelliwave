export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/wavecore/auth'
import { pool } from '@/lib/wavecore/db'

async function ensureTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS "InventoryLedger" (
      id TEXT PRIMARY KEY,
      "transactionId" TEXT NOT NULL,
      "productId" TEXT,
      "productName" TEXT,
      quantity DECIMAL(15,2) NOT NULL DEFAULT 0,
      "beforeQuantity" DECIMAL(15,2) DEFAULT 0,
      "afterQuantity" DECIMAL(15,2) DEFAULT 0,
      "transactionType" TEXT NOT NULL,
      "organizationId" TEXT NOT NULL,
      "createdAt" TIMESTAMP DEFAULT NOW()
    )
  `).catch(() => {})
}

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    await ensureTable()
    const result = await pool.query('SELECT * FROM "InventoryLedger" WHERE "organizationId" = $1 ORDER BY "createdAt" DESC LIMIT 500', [session.organizationId]).catch(() => ({ rows: [] }))
    return NextResponse.json({ ledger: result.rows })
  } catch (error) { return NextResponse.json({ ledger: [] }) }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    await ensureTable()
    const body = await request.json()
    const crypto = require('crypto')
    const id = crypto.randomUUID()
    const transactionId = body.transactionId || 'TXN-' + Date.now().toString()

    const currentStock = await pool.query('SELECT COALESCE(quantity, 0) as qty FROM "StockQuantity" WHERE "productId" = $1 AND "organizationId" = $2', [body.productId, session.organizationId]).catch(() => ({ rows: [{ qty: 0 }] }))
    const beforeQty = Number(currentStock.rows[0]?.qty || 0)
    const movementQty = Number(body.quantity || 0)
    const afterQty = beforeQty + movementQty

    const result = await pool.query(`
      INSERT INTO "InventoryLedger" (id, "transactionId", "productId", "productName", quantity, "beforeQuantity", "afterQuantity", "transactionType", "organizationId", "createdAt")
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW()) RETURNING *
    `, [id, transactionId, body.productId, body.productName, movementQty, beforeQty, afterQty, body.transactionType || 'ADJUSTMENT', session.organizationId])

    return NextResponse.json({ ledger: result.rows[0] }, { status: 201 })
  } catch (error) { return NextResponse.json({ error: (error as Error).message }, { status: 500 }) }
}