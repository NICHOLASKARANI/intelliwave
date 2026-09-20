export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'
import { guardHR } from '@/lib/wavecore/guard'

// POST: Sync marketplace listing stock from ERP StockMove total
// Called after any inventory change (StockMove POST/PATCH) OR scheduled periodic sync
export async function POST(req: NextRequest) {
  try {
    const session = await requireTenant(req)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const guard = await guardHR(req, 'HR_WRITE')
    if (guard.deny) return guard.response!

    const body = await req.json()
    const orgId = session.organizationId

    // If specific SKU provided, sync only that
    const skuFilter = body.sku

    // Get all marketplace listings with SKUs (from this org)
    let listingQuery = `SELECT ml.id, ml.sku, ml."warehouseId", ml.stock AS "listingStock"
                        FROM "MarketplaceListing" ml
                        WHERE ml."organizationId" = $1 AND ml.sku IS NOT NULL AND ml.status = 'ACTIVE'`
    const params: any[] = [orgId]
    if (skuFilter) {
      listingQuery += ` AND ml.sku = $2`
      params.push(skuFilter)
    }

    const listingsRes = await pool.query(listingQuery, params).catch(() => ({ rows: [] }))
    const listings = listingsRes.rows

    // For each listing, compute current ERP stock from StockMove ledger
    const updates: any[] = []

    for (const listing of listings) {
      // Sum all StockMove quantity for this SKU (or product lookup)
      // StockMove uses productId, so we need to find Product by SKU first
      const prodRes = await pool.query(
        `SELECT id FROM "Product" WHERE sku = $1 AND "organizationId" = $2 LIMIT 1`,
        [listing.sku, orgId]
      ).catch(() => ({ rows: [] }))

      let erpStock = 0
      if (prodRes.rows.length > 0) {
        const productId = prodRes.rows[0].id
        const stockRes = await pool.query(
          `SELECT COALESCE(SUM(
             CASE
               WHEN type IN ('RECEIPT','TRANSFER_IN','ADJUSTMENT_ADD','MANUFACTURED') THEN quantity
               WHEN type IN ('ISSUE','TRANSFER_OUT','ADJUSTMENT_SUB','SCRAP','SOLD') THEN -quantity
               ELSE 0
             END
           ), 0) AS net_stock
           FROM "StockMove"
           WHERE "productId" = $1 AND "organizationId" = $2`,
          [productId, orgId]
        ).catch(() => ({ rows: [{ net_stock: 0 }] }))
        erpStock = Math.max(0, Math.round(Number(stockRes.rows[0]?.net_stock || 0)))
      }

      // Only update if changed
      if (erpStock !== Number(listing.listingStock)) {
        await pool.query(
          `UPDATE "MarketplaceListing" SET stock = $1, "updatedAt" = NOW() WHERE id = $2`,
          [erpStock, listing.id]
        )
        updates.push({ listingId: listing.id, sku: listing.sku, oldStock: listing.listingStock, newStock: erpStock })
      }
    }

    return NextResponse.json({
      success: true,
      checkedCount: listings.length,
      updatedCount: updates.length,
      updates,
      message: updates.length > 0
        ? `${updates.length} listing(s) stock-synced from ERP inventory.`
        : 'All listings already in sync.',
    })
  } catch (error) {
    console.error('Stock-Sync error:', error)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}