export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/wavecore/auth'
import { pool } from '@/lib/wavecore/db'

async function ensureWmsTables() {
  // Receiving table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS "Receiving" (
      id TEXT PRIMARY KEY,
      number TEXT UNIQUE,
      "purchaseOrderId" TEXT,
      "supplierId" TEXT,
      status TEXT DEFAULT 'PENDING',
      "receivingType" TEXT DEFAULT 'FULL',
      notes TEXT,
      "organizationId" TEXT NOT NULL,
      "createdAt" TIMESTAMP DEFAULT NOW(),
      "updatedAt" TIMESTAMP DEFAULT NOW()
    )
  `).catch(() => {})
  
  // Picking table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS "Picking" (
      id TEXT PRIMARY KEY,
      number TEXT UNIQUE,
      "salesOrderId" TEXT,
      status TEXT DEFAULT 'PENDING',
      "pickingType" TEXT DEFAULT 'SINGLE',
      "assignedTo" TEXT,
      "organizationId" TEXT NOT NULL,
      "createdAt" TIMESTAMP DEFAULT NOW(),
      "updatedAt" TIMESTAMP DEFAULT NOW()
    )
  `).catch(() => {})
  
  // Packing table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS "Packing" (
      id TEXT PRIMARY KEY,
      number TEXT UNIQUE,
      "pickingId" TEXT,
      status TEXT DEFAULT 'PENDING',
      "packageType" TEXT DEFAULT 'CARTON',
      "weight" DECIMAL(15,2),
      "dimensions" TEXT,
      "trackingNumber" TEXT,
      "organizationId" TEXT NOT NULL,
      "createdAt" TIMESTAMP DEFAULT NOW(),
      "updatedAt" TIMESTAMP DEFAULT NOW()
    )
  `).catch(() => {})
}

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await ensureWmsTables()

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'receiving'

    let table = '"Receiving"'
    if (type === 'picking') table = '"Picking"'
    if (type === 'packing') table = '"Packing"'

    const result = await pool.query(`
      SELECT * FROM ${table}
      WHERE "organizationId" = $1
      ORDER BY "createdAt" DESC
      LIMIT 100
    `, [session.organizationId]).catch(() => ({ rows: [] }))

    return NextResponse.json({ operations: result.rows })
  } catch (error) {
    return NextResponse.json({ operations: [] })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await ensureWmsTables()

    const body = await request.json()
    const type = body.type || 'receiving'
    const crypto = require('crypto')
    const id = crypto.randomUUID()
    const number = (type === 'receiving' ? 'RCV-' : type === 'picking' ? 'PCK-' : 'PKG-') + Date.now().toString().slice(-8)

    let result
    if (type === 'receiving') {
      result = await pool.query(`
        INSERT INTO "Receiving" (id, number, "purchaseOrderId", "supplierId", status, "receivingType", notes, "organizationId", "createdAt", "updatedAt")
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
        RETURNING *
      `, [id, number, body.purchaseOrderId, body.supplierId, body.status || 'PENDING', body.receivingType || 'FULL', body.notes, session.organizationId])
    } else if (type === 'picking') {
      result = await pool.query(`
        INSERT INTO "Picking" (id, number, "salesOrderId", status, "pickingType", "assignedTo", "organizationId", "createdAt", "updatedAt")
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
        RETURNING *
      `, [id, number, body.salesOrderId, body.status || 'PENDING', body.pickingType || 'SINGLE', body.assignedTo, session.organizationId])
    } else {
      result = await pool.query(`
        INSERT INTO "Packing" (id, number, "pickingId", status, "packageType", "weight", "dimensions", "trackingNumber", "organizationId", "createdAt", "updatedAt")
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
        RETURNING *
      `, [id, number, body.pickingId, body.status || 'PENDING', body.packageType || 'CARTON', body.weight, body.dimensions, body.trackingNumber, session.organizationId])
    }

    return NextResponse.json({ operation: result.rows[0] }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}