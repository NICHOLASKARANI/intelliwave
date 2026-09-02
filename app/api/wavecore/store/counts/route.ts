export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/wavecore/auth'
import { pool } from '@/lib/wavecore/db'

// Helper to ensure StockCount table exists
async function ensureStockCountTable() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "StockCount" (
        id TEXT PRIMARY KEY,
        number TEXT UNIQUE,
        "productId" TEXT,
        "productName" TEXT,
        "expectedQuantity" INTEGER DEFAULT 0,
        "actualQuantity" INTEGER DEFAULT 0,
        "variance" INTEGER DEFAULT 0,
        status TEXT DEFAULT 'PENDING',
        notes TEXT,
        "countedBy" TEXT,
        "organizationId" TEXT,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      )
    `)
    await pool.query(`CREATE INDEX IF NOT EXISTS "idx_stockcount_org" ON "StockCount" ("organizationId")`)
    return true
  } catch (error) {
    console.error('Failed to create StockCount table:', error)
    return false
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await ensureStockCountTable()

    const result = await pool.query(`
      SELECT sc.*, p.sku, p."sellingPrice"
      FROM "StockCount" sc
      LEFT JOIN "Product" p ON sc."productId" = p.id
      WHERE sc."organizationId" = $1
      ORDER BY sc."createdAt" DESC
      LIMIT 100
    `, [session.organizationId])

    const counts = result.rows
    const totalCounts = counts.length
    const pendingCounts = counts.filter(c => c.status === 'PENDING').length
    const completedCounts = counts.filter(c => c.status === 'COMPLETED').length
    const totalVariance = counts.reduce((sum, c) => sum + Math.abs(Number(c.variance || 0)), 0)

    return NextResponse.json({ 
      counts,
      stats: {
        totalCounts,
        pendingCounts,
        completedCounts,
        totalVariance
      }
    })
  } catch (error) {
    console.error('Stock Counts GET error:', error)
    return NextResponse.json({ 
      counts: [], 
      stats: { totalCounts: 0, pendingCounts: 0, completedCounts: 0, totalVariance: 0 }
    })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const crypto = require('crypto')
    const id = crypto.randomUUID()
    const number = 'CNT-' + Date.now().toString().slice(-8)

    await ensureStockCountTable()

    const expectedQty = Number(body.expectedQuantity || 0)
    const actualQty = Number(body.actualQuantity || 0)
    const variance = actualQty - expectedQty

    const result = await pool.query(`
      INSERT INTO "StockCount" (id, number, "productId", "productName", "expectedQuantity", "actualQuantity", "variance", status, notes, "countedBy", "organizationId", "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
      RETURNING *
    `, [
      id, 
      number, 
      body.productId || '', 
      body.productName || '', 
      expectedQty, 
      actualQty, 
      variance, 
      body.status || 'PENDING', 
      body.notes || '', 
      body.countedBy || '', 
      session.organizationId
    ])

    // Update product stock if count is completed
    if (body.status === 'COMPLETED' && body.productId) {
      await pool.query(`
        UPDATE "Product" SET stock_level = $1 WHERE id = $2 AND "organizationId" = $3
      `, [actualQty, body.productId, session.organizationId])
    }

    return NextResponse.json({ 
      count: result.rows[0],
      message: 'Stock count created successfully' 
    }, { status: 201 })
  } catch (error) {
    console.error('Stock Counts POST error:', error)
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: 'Stock Count ID required' }, { status: 400 })
    }

    await ensureStockCountTable()

    await pool.query(`DELETE FROM "StockCount" WHERE id = $1 AND "organizationId" = $2`, [id, session.organizationId])

    return NextResponse.json({ success: true, message: 'Stock count deleted successfully' })
  } catch (error) {
    console.error('Stock Counts DELETE error:', error)
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
  }
}