export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/wavecore/auth'
import { pool } from '@/lib/wavecore/db'

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const orgId = session.organizationId

    // Get all key metrics in parallel
    const [productStats, stockValue, stockStates, warehouseStats, movementStats, expiryRisk, deadStock] = await Promise.all([
      // Product stats
      pool.query(`
        SELECT COUNT(*) as "totalProducts",
          SUM(CASE WHEN p."isActive" = true THEN 1 ELSE 0 END) as "activeProducts",
          SUM(CASE WHEN p."isTracked" = true THEN 1 ELSE 0 END) as "trackedProducts"
        FROM "Product" p WHERE p."organizationId" = $1
      `, [orgId]).catch(() => ({ rows: [{ totalProducts: 0, activeProducts: 0, trackedProducts: 0 }] })),
      
      // Stock value
      pool.query(`
        SELECT 
          COALESCE(SUM(p."costPrice" * COALESCE(sq.quantity, 0)), 0) as "costValue",
          COALESCE(SUM(p."sellingPrice" * COALESCE(sq.quantity, 0)), 0) as "sellingValue",
          COALESCE(SUM(COALESCE(sq.quantity, 0)), 0) as "totalQuantity"
        FROM "Product" p
        LEFT JOIN "StockQuantity" sq ON sq."productId" = p.id
        WHERE p."organizationId" = $1
      `, [orgId]).catch(() => ({ rows: [{ costValue: 0, sellingValue: 0, totalQuantity: 0 }] })),
      
      // Stock states
      pool.query(`
        SELECT COALESCE(ss.state, 'AVAILABLE') as state, COALESCE(SUM(ss.quantity), 0) as quantity
        FROM "StockState" ss
        JOIN "Product" p ON ss."productId" = p.id
        WHERE p."organizationId" = $1
        GROUP BY ss.state
      `, [orgId]).catch(() => ({ rows: [] })),
      
      // Warehouse stats
      pool.query(`
        SELECT COUNT(*) as "totalWarehouses",
          SUM(CASE WHEN w."isActive" = true THEN 1 ELSE 0 END) as "activeWarehouses"
        FROM "Warehouse" w WHERE w."organizationId" = $1
      `, [orgId]).catch(() => ({ rows: [{ totalWarehouses: 0, activeWarehouses: 0 }] })),
      
      // Movement stats
      pool.query(`
        SELECT COUNT(*) as "totalMovements",
          SUM(CASE WHEN sm."createdAt" > NOW() - INTERVAL '24 hours' THEN 1 ELSE 0 END) as "movements24h",
          SUM(CASE WHEN sm."createdAt" > NOW() - INTERVAL '7 days' THEN 1 ELSE 0 END) as "movements7d"
        FROM "StockMove" sm WHERE sm."organizationId" = $1
      `, [orgId]).catch(() => ({ rows: [{ totalMovements: 0, movements24h: 0, movements7d: 0 }] })),
      
      // Expiry risk
      pool.query(`
        SELECT COUNT(*) as "expiringCount",
          COALESCE(SUM(b."remainingQuantity" * b."costPrice"), 0) as "expiringValue"
        FROM "Batch" b
        JOIN "Product" p ON b."productId" = p.id
        WHERE p."organizationId" = $1
          AND b."expiryDate" <= NOW() + INTERVAL '90 days'
          AND b."remainingQuantity" > 0
      `, [orgId]).catch(() => ({ rows: [{ expiringCount: 0, expiringValue: 0 }] })),
      
      // Dead stock
      pool.query(`
        SELECT COUNT(*) as "deadStockCount",
          COALESCE(SUM(p."costPrice" * COALESCE(sq.quantity, 0)), 0) as "deadStockValue"
        FROM "Product" p
        LEFT JOIN "StockQuantity" sq ON sq."productId" = p.id
        WHERE p."organizationId" = $1
          AND COALESCE(sq.quantity, 0) > 0
          AND (p.id NOT IN (
            SELECT DISTINCT sm."productId" FROM "StockMove" sm 
            WHERE sm."organizationId" = $1 AND sm."createdAt" > NOW() - INTERVAL '90 days'
          ))
      `, [orgId]).catch(() => ({ rows: [{ deadStockCount: 0, deadStockValue: 0 }] }))
    ])

    const states = stockStates.rows.reduce((acc, s) => {
      acc[s.state] = Number(s.quantity || 0)
      return acc
    }, {} as Record<string, number>)

    const controlTower = {
      inventoryValue: Number(stockValue.rows[0]?.sellingValue || 0),
      costValue: Number(stockValue.rows[0]?.costValue || 0),
      totalQuantity: Number(stockValue.rows[0]?.totalQuantity || 0),
      totalProducts: Number(productStats.rows[0]?.totalProducts || 0),
      activeProducts: Number(productStats.rows[0]?.activeProducts || 0),
      trackedProducts: Number(productStats.rows[0]?.trackedProducts || 0),
      totalWarehouses: Number(warehouseStats.rows[0]?.totalWarehouses || 0),
      activeWarehouses: Number(warehouseStats.rows[0]?.activeWarehouses || 0),
      totalMovements: Number(movementStats.rows[0]?.totalMovements || 0),
      movements24h: Number(movementStats.rows[0]?.movements24h || 0),
      movements7d: Number(movementStats.rows[0]?.movements7d || 0),
      available: states.AVAILABLE || 0,
      reserved: states.RESERVED || 0,
      allocated: states.ALLOCATED || 0,
      quarantine: states.QUARANTINE || 0,
      damaged: states.DAMAGED || 0,
      inTransit: states.IN_TRANSIT || 0,
      expiringCount: Number(expiryRisk.rows[0]?.expiringCount || 0),
      expiringValue: Number(expiryRisk.rows[0]?.expiringValue || 0),
      deadStockCount: Number(deadStock.rows[0]?.deadStockCount || 0),
      deadStockValue: Number(deadStock.rows[0]?.deadStockValue || 0),
      potentialProfit: Number(stockValue.rows[0]?.sellingValue || 0) - Number(stockValue.rows[0]?.costValue || 0),
      stockoutRisk: 0,
      overstockValue: 0
    }

    // Calculate stockout and overstock
    const riskResult = await pool.query(`
      SELECT 
        SUM(CASE WHEN COALESCE(sq.quantity, 0) < p."minStock" THEN 1 ELSE 0 END) as "stockoutRisk",
        COALESCE(SUM(CASE WHEN COALESCE(sq.quantity, 0) > p."maxStock" THEN (COALESCE(sq.quantity, 0) - p."maxStock") * p."costPrice" ELSE 0 END), 0) as "overstockValue"
      FROM "Product" p
      LEFT JOIN "StockQuantity" sq ON sq."productId" = p.id
      WHERE p."organizationId" = $1
    `, [orgId]).catch(() => ({ rows: [{ stockoutRisk: 0, overstockValue: 0 }] }))

    controlTower.stockoutRisk = Number(riskResult.rows[0]?.stockoutRisk || 0)
    controlTower.overstockValue = Number(riskResult.rows[0]?.overstockValue || 0)

    return NextResponse.json({ controlTower })
  } catch (error) {
    console.error('Control Tower error:', error)
    return NextResponse.json({ controlTower: null })
  }
}