export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/wavecore/auth'
import { pool } from '@/lib/wavecore/db'

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const orgId = session.organizationId

    // Get product stats
    const productStats = await pool.query(`
      SELECT 
        COUNT(*) as "totalProducts",
        SUM(CASE WHEN p."isActive" = true THEN 1 ELSE 0 END) as "activeProducts",
        SUM(CASE WHEN p."isTracked" = true THEN 1 ELSE 0 END) as "trackedProducts",
        SUM(CASE WHEN p."trackSerial" = true THEN 1 ELSE 0 END) as "serialTracked",
        SUM(CASE WHEN p."trackBatch" = true THEN 1 ELSE 0 END) as "batchTracked"
      FROM "Product" p
      WHERE p."organizationId" = $1
    `, [orgId])

    // Get warehouse stats
    const warehouseStats = await pool.query(`
      SELECT 
        COUNT(*) as "totalWarehouses",
        SUM(CASE WHEN w."isActive" = true THEN 1 ELSE 0 END) as "activeWarehouses"
      FROM "Warehouse" w
      WHERE w."organizationId" = $1
    `, [orgId]).catch(() => ({ rows: [{ totalWarehouses: 0, activeWarehouses: 0 }] }))

    // Get stock location stats
    const locationStats = await pool.query(`
      SELECT COUNT(*) as "totalLocations"
      FROM "StockLocation" sl
      WHERE sl."organizationId" = $1
    `, [orgId]).catch(() => ({ rows: [{ totalLocations: 0 }] }))

    // Get stock quantity totals
    const stockQuantity = await pool.query(`
      SELECT 
        COALESCE(SUM(sq.quantity), 0) as "totalQuantity",
        COALESCE(SUM(sq."availableQty"), 0) as "availableQuantity",
        COALESCE(SUM(sq."reservedQty"), 0) as "reservedQuantity"
      FROM "StockQuantity" sq
      JOIN "Product" p ON sq."productId" = p.id
      WHERE p."organizationId" = $1
    `, [orgId]).catch(() => ({ rows: [{ totalQuantity: 0, availableQuantity: 0, reservedQuantity: 0 }] }))

    // Get stock value
    const stockValue = await pool.query(`
      SELECT 
        COALESCE(SUM(p."costPrice" * COALESCE(sq.quantity, 0)), 0) as "totalCostValue",
        COALESCE(SUM(p."sellingPrice" * COALESCE(sq.quantity, 0)), 0) as "totalSellingValue"
      FROM "Product" p
      LEFT JOIN "StockQuantity" sq ON sq."productId" = p.id
      WHERE p."organizationId" = $1
    `, [orgId]).catch(() => ({ rows: [{ totalCostValue: 0, totalSellingValue: 0 }] }))

    // Get low stock products
    const lowStock = await pool.query(`
      SELECT 
        p.id,
        p.name,
        p.sku,
        COALESCE(sq.quantity, 0) as "currentStock",
        p."minStock" as "reorderLevel",
        p."maxStock",
        p."sellingPrice",
        p.category
      FROM "Product" p
      LEFT JOIN "StockQuantity" sq ON sq."productId" = p.id
      WHERE p."organizationId" = $1
        AND COALESCE(sq.quantity, 0) < COALESCE(p."minStock", 10)
      ORDER BY COALESCE(sq.quantity, 0) ASC
      LIMIT 20
    `, [orgId]).catch(() => ({ rows: [] }))

    // Get recent stock movements
    const recentMovements = await pool.query(`
      SELECT 
        sm.id,
        sm.number,
        sm."productName",
        sm."fromLocation",
        sm."toLocation",
        sm.quantity,
        sm."movementType",
        sm."createdAt"
      FROM "StockMove" sm
      WHERE sm."organizationId" = $1
      ORDER BY sm."createdAt" DESC
      LIMIT 20
    `, [orgId]).catch(() => ({ rows: [] }))

    // Get warehouse details
    const warehouses = await pool.query(`
      SELECT 
        w.id,
        w.name,
        w.code,
        w.address,
        w."isActive",
        (SELECT COUNT(*) FROM "StockLocation" sl WHERE sl."warehouseId" = w.id) as "locationCount",
        (SELECT COALESCE(SUM(sq.quantity), 0) FROM "StockQuantity" sq 
         JOIN "StockLocation" sl ON sq."locationId" = sl.id 
         WHERE sl."warehouseId" = w.id) as "totalStock"
      FROM "Warehouse" w
      WHERE w."organizationId" = $1
      ORDER BY w.name ASC
    `, [orgId]).catch(() => ({ rows: [] }))

    // Get stock by category
    const stockByCategory = await pool.query(`
      SELECT 
        p.category,
        COUNT(*) as "productCount",
        COALESCE(SUM(sq.quantity), 0) as "totalQuantity",
        COALESCE(SUM(p."sellingPrice" * COALESCE(sq.quantity, 0)), 0) as "stockValue"
      FROM "Product" p
      LEFT JOIN "StockQuantity" sq ON sq."productId" = p.id
      WHERE p."organizationId" = $1 AND p.category IS NOT NULL AND p.category != ''
      GROUP BY p.category
      ORDER BY "stockValue" DESC
      LIMIT 10
    `, [orgId]).catch(() => ({ rows: [] }))

    const stats = {
      totalProducts: Number(productStats.rows[0]?.totalProducts || 0),
      activeProducts: Number(productStats.rows[0]?.activeProducts || 0),
      trackedProducts: Number(productStats.rows[0]?.trackedProducts || 0),
      serialTracked: Number(productStats.rows[0]?.serialTracked || 0),
      batchTracked: Number(productStats.rows[0]?.batchTracked || 0),
      totalWarehouses: Number(warehouseStats.rows[0]?.totalWarehouses || 0),
      activeWarehouses: Number(warehouseStats.rows[0]?.activeWarehouses || 0),
      totalLocations: Number(locationStats.rows[0]?.totalLocations || 0),
      totalQuantity: Number(stockQuantity.rows[0]?.totalQuantity || 0),
      availableQuantity: Number(stockQuantity.rows[0]?.availableQuantity || 0),
      reservedQuantity: Number(stockQuantity.rows[0]?.reservedQuantity || 0),
      totalCostValue: Number(stockValue.rows[0]?.totalCostValue || 0),
      totalSellingValue: Number(stockValue.rows[0]?.totalSellingValue || 0),
      potentialProfit: Number(stockValue.rows[0]?.totalSellingValue || 0) - Number(stockValue.rows[0]?.totalCostValue || 0),
      lowStockCount: lowStock.rows.length,
      recentMovementCount: recentMovements.rows.length
    }

    return NextResponse.json({
      stats,
      lowStockProducts: lowStock.rows,
      recentMovements: recentMovements.rows,
      warehouses: warehouses.rows,
      stockByCategory: stockByCategory.rows
    })
  } catch (error) {
    console.error('Inventory Summary error:', error)
    return NextResponse.json({
      stats: {
        totalProducts: 0,
        activeProducts: 0,
        trackedProducts: 0,
        serialTracked: 0,
        batchTracked: 0,
        totalWarehouses: 0,
        activeWarehouses: 0,
        totalLocations: 0,
        totalQuantity: 0,
        availableQuantity: 0,
        reservedQuantity: 0,
        totalCostValue: 0,
        totalSellingValue: 0,
        potentialProfit: 0,
        lowStockCount: 0,
        recentMovementCount: 0
      },
      lowStockProducts: [],
      recentMovements: [],
      warehouses: [],
      stockByCategory: []
    })
  }
}