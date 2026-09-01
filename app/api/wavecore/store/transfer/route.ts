export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/wavecore/auth'
import { pool } from '@/lib/wavecore/db'

// Helper to ensure Transfer table exists
async function ensureTransferTable() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "Transfer" (
        id TEXT PRIMARY KEY,
        number TEXT UNIQUE,
        "productId" TEXT,
        "productName" TEXT,
        "fromLocation" TEXT,
        "toLocation" TEXT,
        quantity INTEGER DEFAULT 0,
        status TEXT DEFAULT 'PENDING',
        notes TEXT,
        "organizationId" TEXT,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      )
    `)
    await pool.query(`CREATE INDEX IF NOT EXISTS "idx_transfer_org" ON "Transfer" ("organizationId")`)
    return true
  } catch (error) {
    console.error('Failed to create Transfer table:', error)
    return false
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await ensureTransferTable()

    const result = await pool.query(`
      SELECT t.*, p.sku, p."sellingPrice"
      FROM "Transfer" t
      LEFT JOIN "Product" p ON t."productId" = p.id
      WHERE t."organizationId" = $1
      ORDER BY t."createdAt" DESC
      LIMIT 100
    `, [session.organizationId])

    const transfers = result.rows
    const totalTransfers = transfers.length
    const pendingTransfers = transfers.filter(t => t.status === 'PENDING').length
    const completedTransfers = transfers.filter(t => t.status === 'COMPLETED').length
    const totalQuantity = transfers.reduce((sum, t) => sum + Number(t.quantity || 0), 0)

    return NextResponse.json({ 
      transfers,
      stats: {
        totalTransfers,
        pendingTransfers,
        completedTransfers,
        totalQuantity
      }
    })
  } catch (error) {
    console.error('Transfer GET error:', error)
    return NextResponse.json({ 
      transfers: [], 
      stats: { totalTransfers: 0, pendingTransfers: 0, completedTransfers: 0, totalQuantity: 0 }
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
    const number = 'TRN-' + Date.now().toString().slice(-8)

    await ensureTransferTable()

    const result = await pool.query(`
      INSERT INTO "Transfer" (id, number, "productId", "productName", "fromLocation", "toLocation", quantity, status, notes, "organizationId", "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
      RETURNING *
    `, [
      id, 
      number, 
      body.productId || '', 
      body.productName || '', 
      body.fromLocation || 'Main Store', 
      body.toLocation || 'Warehouse', 
      body.quantity || 0, 
      body.status || 'PENDING', 
      body.notes || '', 
      session.organizationId
    ])

    return NextResponse.json({ 
      transfer: result.rows[0],
      message: 'Transfer created successfully' 
    }, { status: 201 })
  } catch (error) {
    console.error('Transfer POST error:', error)
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
      return NextResponse.json({ error: 'Transfer ID required' }, { status: 400 })
    }

    await ensureTransferTable()

    await pool.query(`DELETE FROM "Transfer" WHERE id = $1 AND "organizationId" = $2`, [id, session.organizationId])

    return NextResponse.json({ success: true, message: 'Transfer deleted successfully' })
  } catch (error) {
    console.error('Transfer DELETE error:', error)
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
  }
}