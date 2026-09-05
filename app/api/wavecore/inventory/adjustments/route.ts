export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/wavecore/auth'
import { pool } from '@/lib/wavecore/db'

async function ensureTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS "InventoryAdjustment" (
      id TEXT PRIMARY KEY,
      number TEXT UNIQUE,
      "productId" TEXT,
      "productName" TEXT,
      "adjustmentType" TEXT DEFAULT 'MANUAL',
      quantity DECIMAL(15,2) NOT NULL DEFAULT 0,
      reason TEXT,
      status TEXT DEFAULT 'PENDING',
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
    await ensureTable()
    const result = await pool.query('SELECT * FROM "InventoryAdjustment" WHERE "organizationId" = $1 ORDER BY "createdAt" DESC LIMIT 100', [session.organizationId]).catch(() => ({ rows: [] }))
    return NextResponse.json({ adjustments: result.rows })
  } catch (error) { return NextResponse.json({ adjustments: [] }) }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    await ensureTable()
    const body = await request.json()
    const crypto = require('crypto')
    const id = crypto.randomUUID()
    const number = 'ADJ-' + Date.now().toString().slice(-8)
    
    const productResult = await pool.query('SELECT name FROM "Product" WHERE id = $1 AND "organizationId" = $2', [body.productId, session.organizationId]).catch(() => ({ rows: [] }))
    const productName = productResult.rows[0]?.name || 'N/A'

    const result = await pool.query(`
      INSERT INTO "InventoryAdjustment" (id, number, "productId", "productName", "adjustmentType", quantity, reason, status, "organizationId", "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'APPROVED', $8, NOW(), NOW()) RETURNING *
    `, [id, number, body.productId, productName, body.adjustmentType || 'MANUAL', Number(body.quantity || 0), body.reason || '', session.organizationId])

    // Apply to stock
    await pool.query('UPDATE "StockQuantity" SET quantity = quantity + $1, "updatedAt" = NOW() WHERE "productId" = $2 AND "organizationId" = $3', [Number(body.quantity || 0), body.productId, session.organizationId]).catch(() => {})

    return NextResponse.json({ adjustment: result.rows[0] }, { status: 201 })
  } catch (error) { return NextResponse.json({ error: (error as Error).message }, { status: 500 }) }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    await ensureTable()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    await pool.query('DELETE FROM "InventoryAdjustment" WHERE id = $1 AND "organizationId" = $2', [id, session.organizationId])
    return NextResponse.json({ success: true })
  } catch (error) { return NextResponse.json({ error: 'Delete failed' }, { status: 500 }) }
}