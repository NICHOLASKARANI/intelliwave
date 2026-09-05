export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/wavecore/auth'
import { pool } from '@/lib/wavecore/db'

async function ensureAdjustmentsTable() {
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
      "requestedBy" TEXT,
      "approvedBy" TEXT,
      "approvalDate" TIMESTAMP,
      notes TEXT,
      "organizationId" TEXT NOT NULL,
      "createdAt" TIMESTAMP DEFAULT NOW(),
      "updatedAt" TIMESTAMP DEFAULT NOW()
    )
  `).catch(() => {})
  await pool.query(`CREATE INDEX IF NOT EXISTS "idx_adjustment_org" ON "InventoryAdjustment" ("organizationId")`).catch(() => {})
}

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await ensureAdjustmentsTable()

    const result = await pool.query(`
      SELECT * FROM "InventoryAdjustment"
      WHERE "organizationId" = $1
      ORDER BY "createdAt" DESC
      LIMIT 100
    `, [session.organizationId]).catch(() => ({ rows: [] }))

    return NextResponse.json({ adjustments: result.rows })
  } catch (error) {
    console.error('Adjustments GET error:', error)
    return NextResponse.json({ adjustments: [] })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await ensureAdjustmentsTable()

    const body = await request.json()
    const crypto = require('crypto')
    const id = crypto.randomUUID()
    const number = 'ADJ-' + Date.now().toString().slice(-8)

    // Get product name
    const productResult = await pool.query(
      'SELECT name FROM "Product" WHERE id = $1 AND "organizationId" = $2',
      [body.productId, session.organizationId]
    ).catch(() => ({ rows: [] }))

    const productName = productResult.rows[0]?.name || 'N/A'

    const result = await pool.query(`
      INSERT INTO "InventoryAdjustment" (
        id, number, "productId", "productName", "adjustmentType",
        quantity, reason, status, "requestedBy", notes,
        "organizationId", "createdAt", "updatedAt"
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
      RETURNING *
    `, [
      id, number, body.productId, productName, body.adjustmentType || 'MANUAL',
      Number(body.quantity || 0), body.reason || '', body.status || 'PENDING',
      body.requestedBy || '', body.notes || '',
      session.organizationId
    ])

    // If auto-approved, apply to stock
    if (body.status === 'APPROVED' || body.autoApprove === true) {
      await pool.query(`
        UPDATE "StockQuantity" SET quantity = quantity + $1, "updatedAt" = NOW()
        WHERE "productId" = $2 AND "organizationId" = $3
      `, [Number(body.quantity || 0), body.productId, session.organizationId]).catch(() => {})
    }

    return NextResponse.json({ adjustment: result.rows[0] }, { status: 201 })
  } catch (error) {
    console.error('Adjustments POST error:', error)
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await ensureAdjustmentsTable()

    const body = await request.json()

    const result = await pool.query(`
      UPDATE "InventoryAdjustment" SET
        status = $1,
        "approvedBy" = $2,
        "approvalDate" = CASE WHEN $1 IN ('APPROVED', 'REJECTED') THEN NOW() ELSE NULL END,
        notes = $3,
        "updatedAt" = NOW()
      WHERE id = $4 AND "organizationId" = $5
      RETURNING *
    `, [body.status, body.approvedBy, body.notes, body.id, session.organizationId])

    if (result.rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // If approved, apply to stock
    if (body.status === 'APPROVED') {
      const adjustment = result.rows[0]
      await pool.query(`
        UPDATE "StockQuantity" SET quantity = quantity + $1, "updatedAt" = NOW()
        WHERE "productId" = $2 AND "organizationId" = $3
      `, [Number(adjustment.quantity || 0), adjustment.productId, session.organizationId]).catch(() => {})
    }

    return NextResponse.json({ adjustment: result.rows[0] })
  } catch (error) {
    console.error('Adjustments PUT error:', error)
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await ensureAdjustmentsTable()

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

    await pool.query('DELETE FROM "InventoryAdjustment" WHERE id = $1 AND "organizationId" = $2', [id, session.organizationId])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Adjustments DELETE error:', error)
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
  }
}