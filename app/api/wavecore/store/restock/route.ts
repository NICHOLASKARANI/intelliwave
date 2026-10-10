export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/wavecore/auth'
import { pool } from '@/lib/wavecore/db'

// Helper to ensure Restock table exists
async function ensureRestockTable() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "Restock" (
        id TEXT PRIMARY KEY,
        number TEXT UNIQUE,
        "productId" TEXT,
        "productName" TEXT,
        quantity INTEGER DEFAULT 0,
        "supplierName" TEXT,
        status TEXT DEFAULT 'PENDING',
        notes TEXT,
        "organizationId" TEXT,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      )
    `)
    await pool.query(`CREATE INDEX IF NOT EXISTS "idx_restock_org" ON "Restock" ("organizationId")`)
    return true
  } catch (error) {
    console.error('Failed to create Restock table:', error)
    return false
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await ensureRestockTable()

    // Get all restock orders
    const restockResult = await pool.query(`
      SELECT r.*, p.sku, p."sellingPrice"
      FROM "Restock" r
      LEFT JOIN "Product" p ON r."productId" = p.id
      WHERE r."organizationId" = $1
      ORDER BY r."createdAt" DESC
      LIMIT 100
    `, [session.organizationId])

    // All active products — the dropdown must never be empty.
    // Low-stock items are flagged so the UI can sort them first.
    const allProductsResult = await pool.query(`
      SELECT
        p.id,
        p.name,
        p.sku,
        COALESCE(SUM(sq.quantity), 0) AS stock_level,
        COALESCE(p."minStock", 10) AS "reorderLevel",
        p."sellingPrice",
        p.category,
        (COALESCE(SUM(sq.quantity), 0) < COALESCE(p."minStock", 10)) AS "isLowStock"
      FROM "Product" p
      LEFT JOIN "StockQuantity" sq ON sq."productId" = p.id
      WHERE p."organizationId" = $1 AND COALESCE(p."isActive", true) = true
      GROUP BY p.id
      ORDER BY (COALESCE(SUM(sq.quantity), 0) < COALESCE(p."minStock", 10)) DESC, p.name ASC
    `, [session.organizationId])

    const lowStockResult = { rows: allProductsResult.rows.filter((p: any) => p.isLowStock) }

    const restocks = restockResult.rows
    const lowStockProducts = lowStockResult.rows

    const stats = {
      totalRestocks: restocks.length,
      pendingRestocks: restocks.filter(r => r.status === 'PENDING').length,
      completedRestocks: restocks.filter(r => r.status === 'COMPLETED').length,
      lowStockCount: lowStockProducts.length,
      totalQuantity: restocks.reduce((sum, r) => sum + Number(r.quantity || 0), 0)
    }

    return NextResponse.json({ 
      restocks,
      lowStockProducts,
      allProducts: allProductsResult.rows,
      stats
    })
  } catch (error) {
    console.error('Restock GET error:', error)
    return NextResponse.json({ 
      restocks: [], 
      lowStockProducts: [], 
      stats: { totalRestocks: 0, pendingRestocks: 0, completedRestocks: 0, lowStockCount: 0, totalQuantity: 0 }
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
    const number = 'RST-' + Date.now().toString().slice(-8)

    await ensureRestockTable()

    const result = await pool.query(`
      INSERT INTO "Restock" (id, number, "productId", "productName", quantity, "supplierName", status, notes, "organizationId", "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
      RETURNING *
    `, [
      id, 
      number, 
      body.productId || '', 
      body.productName || '', 
      body.quantity || 0, 
      body.supplierName || '', 
      body.status || 'PENDING', 
      body.notes || '', 
      session.organizationId
    ])

    return NextResponse.json({ 
      restock: result.rows[0],
      message: 'Restock order created successfully' 
    }, { status: 201 })
  } catch (error) {
    console.error('Restock POST error:', error)
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
      return NextResponse.json({ error: 'Restock ID required' }, { status: 400 })
    }

    await ensureRestockTable()

    await pool.query(`DELETE FROM "Restock" WHERE id = $1 AND "organizationId" = $2`, [id, session.organizationId])

    return NextResponse.json({ success: true, message: 'Restock order deleted successfully' })
  } catch (error) {
    console.error('Restock DELETE error:', error)
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
  }
}
