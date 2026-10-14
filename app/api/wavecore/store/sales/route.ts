export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/wavecore/auth'
import { pool } from '@/lib/wavecore/db'
import { checkCsrf } from '@/lib/wavecore/csrf'

// Auto-add `locationId` on the two tables (idempotent)
let _schemaEnsured = false
async function ensureSalesSchema() {
  if (_schemaEnsured) return
  await pool.query(`ALTER TABLE "SalesOrder" ADD COLUMN IF NOT EXISTS "locationId" TEXT`).catch(() => {})
  await pool.query(`ALTER TABLE "SalesOrderItem" ADD COLUMN IF NOT EXISTS "locationId" TEXT`).catch(() => {})
  _schemaEnsured = true
}

// ============================================================
// GET — list sales
// ============================================================
export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const locationId = searchParams.get('locationId')

    const params: any[] = [session.organizationId]
    const locationWhere = locationId ? ' AND so."locationId" = $2' : ''
    if (locationId) params.push(locationId)

    const result = await pool.query(
      `SELECT so.*, c.name as "customerName",
              sl.name as "locationName"
       FROM "SalesOrder" so
       LEFT JOIN "Customer" c ON so."customerId" = c.id
       LEFT JOIN "StockLocation" sl ON so."locationId" = sl.id
       WHERE so."organizationId" = $1${locationWhere}
       ORDER BY so."createdAt" DESC LIMIT 500`,
      params
    )
    return NextResponse.json({ sales: result.rows })
  } catch (error) {
    return NextResponse.json({ sales: [] })
  }
}

// ============================================================
// POST — create sale with real, transactional stock movement
// Body: { items: [{ id, name, quantity, price }], total, customerName?, locationId }
//
// Strict mode: locationId REQUIRED. Sale fails if any line has
// insufficient stock at that location. Stock is decremented only
// on the specific (productId, locationId) row.
// ============================================================
export async function POST(request: NextRequest) {
  let client: any = null
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const csrf = checkCsrf(request)
    if (!csrf.allow) return csrf.response!

    await ensureSalesSchema()

    const body = await request.json()
    const items: any[] = Array.isArray(body.items) ? body.items : []
    const total = Number(body.total || 0)
    const locationId = String(body.locationId || '').trim()
    const customerName = String(body.customerName || '').trim()

    if (items.length === 0) return NextResponse.json({ error: 'Cart is empty' }, { status: 400 })
    if (!locationId) return NextResponse.json({ error: 'Shop (location) is required' }, { status: 400 })

    // Verify the location belongs to this org
    const locCheck = await pool.query(
      `SELECT sl.id FROM "StockLocation" sl
       JOIN "Warehouse" w ON w.id = sl."warehouseId"
       WHERE sl.id = $1 AND w."organizationId" = $2`,
      [locationId, session.organizationId]
    )
    if (locCheck.rowCount === 0) {
      return NextResponse.json({ error: 'Shop not found for this organization' }, { status: 404 })
    }

    const crypto = require('crypto')
    const saleId = crypto.randomUUID()
    const saleNumber = 'SALE-' + Date.now().toString().slice(-8)

    client = await pool.connect()
    try {
      await client.query('BEGIN')

      // 1. Customer — reuse or create Walk-in
      const finalCustomerName = customerName || 'Walk-in Customer'
      let customerId: string
      const existing = await client.query(
        'SELECT id FROM "Customer" WHERE name = $1 AND "organizationId" = $2 LIMIT 1',
        [finalCustomerName, session.organizationId]
      )
      if (existing.rows.length > 0) {
        customerId = existing.rows[0].id
      } else {
        customerId = crypto.randomUUID()
        await client.query(
          `INSERT INTO "Customer" (id, name, type, status, "organizationId", "createdAt", "updatedAt")
           VALUES ($1, $2, 'INDIVIDUAL', 'ACTIVE', $3, NOW(), NOW())`,
          [customerId, finalCustomerName, session.organizationId]
        )
      }

      // 2. Validate + lock stock for every line item BEFORE writing
      const lockedStock: Record<string, { row: any, required: number }> = {}
      for (const item of items) {
        const productId = String(item.id || '').trim()
        const qty = Number(item.quantity || 0)
        if (!productId || qty <= 0) {
          await client.query('ROLLBACK')
          return NextResponse.json({ error: 'Invalid line item' }, { status: 400 })
        }
        const stockRes = await client.query(
          `SELECT id, quantity FROM "StockQuantity"
           WHERE "productId" = $1 AND "locationId" = $2
           FOR UPDATE`,
          [productId, locationId]
        )
        const row = stockRes.rows[0]
        const available = Number(row?.quantity || 0)
        if (!row || available < qty) {
          await client.query('ROLLBACK')
          const name = item.name || 'item'
          return NextResponse.json(
            { error: `Insufficient stock for "${name}" at this shop. Available: ${available}, requested: ${qty}` },
            { status: 400 }
          )
        }
        lockedStock[productId] = { row, required: qty }
      }

      // 3. Insert sale header
      const saleResult = await client.query(
        `INSERT INTO "SalesOrder"
           (id, number, date, status, subtotal, "taxAmount", total, "customerId", "organizationId", "locationId", "createdAt", "updatedAt")
         VALUES ($1, $2, NOW(), 'DELIVERED', $3, 0, $4, $5, $6, $7, NOW(), NOW())
         RETURNING *`,
        [saleId, saleNumber, total, total, customerId, session.organizationId, locationId]
      )

      // 4. Insert items + decrement stock at the specific location
      for (const item of items) {
        const productId = String(item.id)
        const qty = Number(item.quantity || 0)
        const price = Number(item.price || 0)

        let description = item.description || item.name || null
        if (!description) {
          const p = await client.query(
            'SELECT name FROM "Product" WHERE id = $1 AND "organizationId" = $2',
            [productId, session.organizationId]
          )
          description = p.rows[0]?.name || 'Item'
        }

        await client.query(
          `INSERT INTO "SalesOrderItem"
             (id, "salesOrderId", "productId", description, quantity, "unitPrice", total, "organizationId", "locationId", "createdAt")
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())`,
          [crypto.randomUUID(), saleId, productId, description, qty, price, qty * price, session.organizationId, locationId]
        )

        await client.query(
          `UPDATE "StockQuantity"
             SET quantity = quantity - $1,
                 "availableQty" = GREATEST("availableQty" - $1, 0),
                 "updatedAt" = NOW()
           WHERE "productId" = $2 AND "locationId" = $3`,
          [qty, productId, locationId]
        )
      }

      await client.query('COMMIT')

      return NextResponse.json({
        sale: saleResult.rows[0],
        itemCount: items.length,
        total,
      }, { status: 201 })
    } catch (err) {
      await client.query('ROLLBACK').catch(() => {})
      throw err
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('Sale create error:', error)
    if (client) try { client.release() } catch {}
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}

// ============================================================
// DELETE — remove sale (does not reverse stock — historical record)
// ============================================================
export async function DELETE(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const csrf = checkCsrf(request)
    if (!csrf.allow) return csrf.response!

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    await pool.query(`DELETE FROM "SalesOrderItem" WHERE "salesOrderId" = $1`, [id]).catch(() => {})
    await pool.query(`DELETE FROM "SalesOrder" WHERE id = $1 AND "organizationId" = $2`, [id, session.organizationId])

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
  }
}
