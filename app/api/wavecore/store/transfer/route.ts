export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/wavecore/auth'
import { pool } from '@/lib/wavecore/db'
import { checkCsrf } from '@/lib/wavecore/csrf'

// ============================================================
// Transfer API — REAL stock movement between two locations.
//
// When a transfer is created:
//   1. BEGIN transaction
//   2. Verify source location has enough stock
//   3. Decrement source's StockQuantity.quantity
//   4. Upsert destination's StockQuantity.quantity (+N)
//   5. Insert a StockMove row (type=TRANSFER, status=COMPLETED)
//   6. Insert a Transfer row (the historical record)
//   7. COMMIT
//
// If anything fails, the whole transfer is rolled back — no partial
// stock movement, no phantom transfers.
// ============================================================

// Auto-add a `Transfer` header table if it's missing (idempotent)
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
    await pool.query(`CREATE INDEX IF NOT EXISTS "idx_transfer_org" ON "Transfer" ("organizationId")`).catch(() => {})
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

    // Also return available locations for the UI
    const locationsRes = await pool.query(`
      SELECT sl.id, sl.name, sl.code, sl."warehouseId", w.name as "warehouseName"
      FROM "StockLocation" sl
      JOIN "Warehouse" w ON w.id = sl."warehouseId"
      WHERE w."organizationId" = $1 AND sl."isActive" = true AND w."isActive" = true
      ORDER BY w.name, sl.name
    `, [session.organizationId])

    const transfers = result.rows
    const stats = {
      totalTransfers: transfers.length,
      pendingTransfers: transfers.filter(t => t.status === 'PENDING').length,
      completedTransfers: transfers.filter(t => t.status === 'COMPLETED').length,
      totalQuantity: transfers.reduce((sum, t) => sum + Number(t.quantity || 0), 0),
    }

    return NextResponse.json({ transfers, stats, locations: locationsRes.rows })
  } catch (error) {
    console.error('Transfer GET error:', error)
    return NextResponse.json({
      transfers: [],
      locations: [],
      stats: { totalTransfers: 0, pendingTransfers: 0, completedTransfers: 0, totalQuantity: 0 },
    })
  }
}

// ============================================================
// POST — create a transfer AND move the actual stock.
// Body: { productId, fromLocationId, toLocationId, quantity, notes? }
// ============================================================
export async function POST(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const csrf = checkCsrf(request)
    if (!csrf.allow) return csrf.response!

    await ensureTransferTable()

    const body = await request.json()
    const productId = String(body.productId || '').trim()
    const fromLocationId = String(body.fromLocationId || '').trim()
    const toLocationId = String(body.toLocationId || '').trim()
    const qty = Number(body.quantity || 0)
    const notes = String(body.notes || '')
    const orgId = session.organizationId

    if (!productId) return NextResponse.json({ error: 'Product is required' }, { status: 400 })
    if (!fromLocationId) return NextResponse.json({ error: 'Source location is required' }, { status: 400 })
    if (!toLocationId) return NextResponse.json({ error: 'Destination location is required' }, { status: 400 })
    if (fromLocationId === toLocationId) return NextResponse.json({ error: 'Source and destination must be different' }, { status: 400 })
    if (!Number.isFinite(qty) || qty <= 0) return NextResponse.json({ error: 'Quantity must be greater than zero' }, { status: 400 })

    // Verify both locations belong to this org
    const locCheck = await pool.query(`
      SELECT sl.id
      FROM "StockLocation" sl
      JOIN "Warehouse" w ON w.id = sl."warehouseId"
      WHERE sl.id = ANY($1) AND w."organizationId" = $2
    `, [[fromLocationId, toLocationId], orgId])
    if (locCheck.rowCount !== 2) {
      return NextResponse.json({ error: 'One or both locations not found for this organization' }, { status: 404 })
    }

    // Verify product belongs to this org
    const prodCheck = await pool.query(
      'SELECT id, name FROM "Product" WHERE id = $1 AND "organizationId" = $2 LIMIT 1',
      [productId, orgId]
    )
    if (prodCheck.rowCount === 0) return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    const productName = prodCheck.rows[0].name

    const crypto = require('crypto')
    const transferId = crypto.randomUUID()
    const transferNumber = 'TRN-' + Date.now().toString().slice(-8)
    const moveId = crypto.randomUUID()
    const moveRef = 'TRN-' + Date.now().toString().slice(-8)

    const client = await pool.connect()
    try {
      await client.query('BEGIN')

      // 1. Check source stock
      const srcQty = await client.query(
        'SELECT id, quantity FROM "StockQuantity" WHERE "productId" = $1 AND "locationId" = $2 FOR UPDATE',
        [productId, fromLocationId]
      )
      const available = Number(srcQty.rows[0]?.quantity || 0)
      if (available < qty) {
        await client.query('ROLLBACK')
        return NextResponse.json(
          { error: `Insufficient stock at source. Available: ${available}, requested: ${qty}` },
          { status: 400 }
        )
      }

      // 2. Decrement source
      await client.query(
        'UPDATE "StockQuantity" SET quantity = quantity - $1, "availableQty" = GREATEST("availableQty" - $1, 0), "updatedAt" = NOW() WHERE "productId" = $2 AND "locationId" = $3',
        [qty, productId, fromLocationId]
      )

      // 3. Upsert destination
      const dest = await client.query(
        'SELECT id FROM "StockQuantity" WHERE "productId" = $1 AND "locationId" = $2 FOR UPDATE',
        [productId, toLocationId]
      )
      if (dest.rowCount === 0) {
        await client.query(
          `INSERT INTO "StockQuantity" (id, quantity, "reservedQty", "availableQty", "productId", "locationId", "createdAt", "updatedAt")
           VALUES ($1, $2, 0, $2, $3, $4, NOW(), NOW())`,
          [crypto.randomUUID(), qty, productId, toLocationId]
        )
      } else {
        await client.query(
          'UPDATE "StockQuantity" SET quantity = quantity + $1, "availableQty" = "availableQty" + $1, "updatedAt" = NOW() WHERE "productId" = $2 AND "locationId" = $3',
          [qty, productId, toLocationId]
        )
      }

      // 4. Log a StockMove
      await client.query(
        `INSERT INTO "StockMove" (id, type, status, reference, date, notes, "productId", quantity, "fromLocationId", "toLocationId", "organizationId", "createdAt", "updatedAt")
         VALUES ($1, 'TRANSFER'::"StockMoveType", 'COMPLETED'::"MoveStatus", $2, NOW(), $3, $4, $5, $6, $7, $8, NOW(), NOW())`,
        [moveId, moveRef, notes || null, productId, qty, fromLocationId, toLocationId, orgId]
      )

      // 5. Resolve display names for the Transfer row (so list view shows names)
      const namesRes = await client.query(
        'SELECT id, name FROM "StockLocation" WHERE id = ANY($1)',
        [[fromLocationId, toLocationId]]
      )
      const nameById: Record<string, string> = {}
      for (const r of namesRes.rows) nameById[r.id] = r.name

      // 6. Insert the Transfer header
      const result = await client.query(
        `INSERT INTO "Transfer" (id, number, "productId", "productName", "fromLocation", "toLocation", quantity, status, notes, "organizationId", "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'COMPLETED', $8, $9, NOW(), NOW())
         RETURNING *`,
        [
          transferId,
          transferNumber,
          productId,
          productName,
          nameById[fromLocationId] || fromLocationId,
          nameById[toLocationId] || toLocationId,
          qty,
          notes || null,
          orgId,
        ]
      )

      await client.query('COMMIT')

      return NextResponse.json({
        transfer: result.rows[0],
        move: { id: moveId, reference: moveRef },
        message: 'Transfer completed — stock moved',
      }, { status: 201 })
    } catch (err) {
      await client.query('ROLLBACK').catch(() => {})
      throw err
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('Transfer POST error:', error)
    return NextResponse.json({ error: 'Transfer failed: ' + (error as Error).message }, { status: 500 })
  }
}

// ============================================================
// DELETE — removes the Transfer header row only.
// Stock movement is NOT reversed (historical audit integrity).
// To reverse, create a new transfer in the opposite direction.
// ============================================================
export async function DELETE(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const csrf = checkCsrf(request)
    if (!csrf.allow) return csrf.response!

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Transfer ID required' }, { status: 400 })

    await ensureTransferTable()

    await pool.query('DELETE FROM "Transfer" WHERE id = $1 AND "organizationId" = $2', [id, session.organizationId])

    return NextResponse.json({ success: true, message: 'Transfer record deleted (stock movement not reversed)' })
  } catch (error) {
    console.error('Transfer DELETE error:', error)
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
  }
}