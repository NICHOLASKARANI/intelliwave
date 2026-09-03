export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/wavecore/auth'
import { pool } from '@/lib/wavecore/db'

async function ensureReturnsTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS "Return" (
      id TEXT PRIMARY KEY,
      number TEXT UNIQUE,
      "returnType" TEXT DEFAULT 'CUSTOMER',
      "productId" TEXT,
      "productName" TEXT,
      quantity DECIMAL(15,2) DEFAULT 0,
      "batchNumber" TEXT,
      "serialNumber" TEXT,
      "returnReason" TEXT,
      status TEXT DEFAULT 'PENDING',
      "warehouseId" TEXT,
      "warehouseName" TEXT,
      "customerName" TEXT,
      "salesOrderId" TEXT,
      "disposition" TEXT DEFAULT 'PENDING',
      notes TEXT,
      "organizationId" TEXT NOT NULL,
      "createdAt" TIMESTAMP DEFAULT NOW(),
      "updatedAt" TIMESTAMP DEFAULT NOW()
    )
  `).catch(() => {})
  await pool.query(`CREATE INDEX IF NOT EXISTS "idx_return_org" ON "Return" ("organizationId")`).catch(() => {})
}

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await ensureReturnsTable()

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const returnType = searchParams.get('type')

    let query = `SELECT * FROM "Return" WHERE "organizationId" = $1`
    const params: any[] = [session.organizationId]
    let idx = 2
    if (status) { query += ` AND status = $${idx}`; params.push(status); idx++ }
    if (returnType) { query += ` AND "returnType" = $${idx}`; params.push(returnType); idx++ }
    query += ` ORDER BY "createdAt" DESC LIMIT 100`

    const result = await pool.query(query, params).catch(() => ({ rows: [] }))

    const summary = {
      total: result.rows.length,
      pending: result.rows.filter(r => r.status === 'PENDING').length,
      received: result.rows.filter(r => r.status === 'RECEIVED').length,
      inspected: result.rows.filter(r => r.status === 'INSPECTED').length,
      restocked: result.rows.filter(r => r.disposition === 'RESTOCK').length,
      scrapped: result.rows.filter(r => r.disposition === 'SCRAP').length,
      refunded: result.rows.filter(r => r.disposition === 'REFUND').length
    }

    return NextResponse.json({ returns: result.rows, summary })
  } catch (error) {
    return NextResponse.json({ returns: [], summary: { total: 0, pending: 0, received: 0, inspected: 0, restocked: 0, scrapped: 0, refunded: 0 } })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await ensureReturnsTable()

    const body = await request.json()
    const crypto = require('crypto')
    const id = crypto.randomUUID()
    const number = 'RTR-' + Date.now().toString().slice(-8)

    const result = await pool.query(`
      INSERT INTO "Return" (
        id, number, "returnType", "productId", "productName",
        quantity, "batchNumber", "serialNumber", "returnReason",
        status, "warehouseId", "warehouseName", "customerName",
        "salesOrderId", "disposition", notes,
        "organizationId", "createdAt", "updatedAt"
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, NOW(), NOW())
      RETURNING *
    `, [
      id, number, body.returnType || 'CUSTOMER', body.productId, body.productName,
      body.quantity || 0, body.batchNumber, body.serialNumber, body.returnReason,
      body.status || 'PENDING', body.warehouseId, body.warehouseName, body.customerName,
      body.salesOrderId, body.disposition || 'PENDING', body.notes,
      session.organizationId
    ])

    return NextResponse.json({ return: result.rows[0] }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await ensureReturnsTable()

    const body = await request.json()
    const result = await pool.query(`
      UPDATE "Return" SET
        status = $1,
        "disposition" = $2,
        notes = $3,
        "updatedAt" = NOW()
      WHERE id = $4 AND "organizationId" = $5
      RETURNING *
    `, [body.status, body.disposition, body.notes, body.id, session.organizationId])

    if (result.rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // If restocked, add back to inventory
    if (body.disposition === 'RESTOCK' && result.rows[0].productId) {
      await pool.query(`
        UPDATE "StockQuantity" SET quantity = quantity + $1, "updatedAt" = NOW()
        WHERE "productId" = $2
      `, [result.rows[0].quantity, result.rows[0].productId]).catch(() => {})
    }

    return NextResponse.json({ return: result.rows[0] })
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}