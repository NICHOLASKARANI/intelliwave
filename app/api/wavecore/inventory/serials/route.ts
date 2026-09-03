export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/wavecore/auth'
import { pool } from '@/lib/wavecore/db'

async function ensureSerialsTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS "SerialNumber" (
      id TEXT PRIMARY KEY,
      "serialNumber" TEXT NOT NULL UNIQUE,
      "productId" TEXT NOT NULL,
      "productName" TEXT,
      status TEXT DEFAULT 'IN_STOCK',
      "warehouseId" TEXT,
      "warehouseName" TEXT,
      "binLocation" TEXT,
      "batchNumber" TEXT,
      "purchaseOrderId" TEXT,
      "supplierId" TEXT,
      "supplierName" TEXT,
      "manufacturingDate" TIMESTAMP,
      "expiryDate" TIMESTAMP,
      "warrantyStart" TIMESTAMP,
      "warrantyEnd" TIMESTAMP,
      "soldTo" TEXT,
      "soldDate" TIMESTAMP,
      "salesOrderId" TEXT,
      "returnDate" TIMESTAMP,
      "returnReason" TEXT,
      "organizationId" TEXT NOT NULL,
      "createdAt" TIMESTAMP DEFAULT NOW(),
      "updatedAt" TIMESTAMP DEFAULT NOW()
    )
  `).catch(() => {})
  await pool.query(`CREATE INDEX IF NOT EXISTS "idx_serial_product" ON "SerialNumber" ("productId")`).catch(() => {})
  await pool.query(`CREATE INDEX IF NOT EXISTS "idx_serial_number" ON "SerialNumber" ("serialNumber")`).catch(() => {})
}

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await ensureSerialsTable()

    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('productId')
    const serialNumber = searchParams.get('serialNumber')
    const status = searchParams.get('status')

    let query = `SELECT * FROM "SerialNumber" WHERE "organizationId" = $1`
    const params: any[] = [session.organizationId]
    let idx = 2

    if (productId) { query += ` AND "productId" = $${idx}`; params.push(productId); idx++ }
    if (serialNumber) { query += ` AND "serialNumber" ILIKE $${idx}`; params.push('%' + serialNumber + '%'); idx++ }
    if (status) { query += ` AND status = $${idx}`; params.push(status); idx++ }

    query += ` ORDER BY "createdAt" DESC LIMIT 200`

    const result = await pool.query(query, params).catch(() => ({ rows: [] }))

    const summary = {
      total: result.rows.length,
      inStock: result.rows.filter(s => s.status === 'IN_STOCK').length,
      sold: result.rows.filter(s => s.status === 'SOLD').length,
      returned: result.rows.filter(s => s.status === 'RETURNED').length,
      expired: result.rows.filter(s => s.status === 'EXPIRED').length
    }

    return NextResponse.json({ serials: result.rows, summary })
  } catch (error) {
    return NextResponse.json({ serials: [], summary: { total: 0, inStock: 0, sold: 0, returned: 0, expired: 0 } })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await ensureSerialsTable()

    const body = await request.json()
    const crypto = require('crypto')
    const id = crypto.randomUUID()

    const result = await pool.query(`
      INSERT INTO "SerialNumber" (
        id, "serialNumber", "productId", "productName", status,
        "warehouseId", "warehouseName", "binLocation", "batchNumber",
        "purchaseOrderId", "supplierId", "supplierName",
        "manufacturingDate", "expiryDate", "warrantyStart", "warrantyEnd",
        "organizationId", "createdAt", "updatedAt"
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, NOW(), NOW())
      RETURNING *
    `, [
      id, body.serialNumber, body.productId, body.productName, body.status || 'IN_STOCK',
      body.warehouseId, body.warehouseName, body.binLocation, body.batchNumber,
      body.purchaseOrderId, body.supplierId, body.supplierName,
      body.manufacturingDate, body.expiryDate, body.warrantyStart, body.warrantyEnd,
      session.organizationId
    ])

    return NextResponse.json({ serial: result.rows[0] }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await ensureSerialsTable()

    const body = await request.json()
    const result = await pool.query(`
      UPDATE "SerialNumber" SET
        status = $1,
        "warehouseId" = $2,
        "warehouseName" = $3,
        "binLocation" = $4,
        "soldTo" = $5,
        "soldDate" = $6,
        "salesOrderId" = $7,
        "returnDate" = $8,
        "returnReason" = $9,
        "updatedAt" = NOW()
      WHERE id = $10 AND "organizationId" = $11
      RETURNING *
    `, [body.status, body.warehouseId, body.warehouseName, body.binLocation, body.soldTo, body.soldDate, body.salesOrderId, body.returnDate, body.returnReason, body.id, session.organizationId])

    if (result.rows.length === 0) return NextResponse.json({ error: 'Serial not found' }, { status: 404 })
    return NextResponse.json({ serial: result.rows[0] })
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}