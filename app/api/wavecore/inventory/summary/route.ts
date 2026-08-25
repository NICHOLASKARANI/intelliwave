export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)

    const [
      totalProducts,
      totalStockValue,
      lowStock,
      outOfStock,
      warehouses,
      recentMovements,
    ] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM "Product" WHERE "organizationId" = $1', [session!.organizationId]),
      pool.query(
        `SELECT COALESCE(SUM(p."costPrice" * sq.quantity), 0) as total_value
         FROM "StockQuantity" sq
         JOIN "Product" p ON p.id = sq."productId"
         WHERE p."organizationId" = $1`,
        [session!.organizationId]
      ),
      pool.query(
        `SELECT COUNT(*) FROM "Product" p
         WHERE p."organizationId" = $1
         AND (SELECT COALESCE(SUM(sq.quantity), 0) FROM "StockQuantity" sq WHERE sq."productId" = p.id) <= p."minStock"`,
        [session!.organizationId]
      ),
      pool.query(
        `SELECT COUNT(*) FROM "Product" p
         WHERE p."organizationId" = $1
         AND (SELECT COALESCE(SUM(sq.quantity), 0) FROM "StockQuantity" sq WHERE sq."productId" = p.id) = 0`,
        [session!.organizationId]
      ),
      pool.query('SELECT COUNT(*) FROM "Warehouse" WHERE "organizationId" = $1 AND "isActive" = true', [session!.organizationId]),
      pool.query(
        `SELECT sm.id, sm.type, sm.quantity, sm."createdAt", p.name as product_name
         FROM "StockMove" sm
         JOIN "Product" p ON p.id = sm."productId"
         WHERE sm."organizationId" = $1
         ORDER BY sm."createdAt" DESC LIMIT 10`,
        [session!.organizationId]
      ),
    ])

    return NextResponse.json({
      summary: {
        totalProducts: parseInt(totalProducts.rows[0].count),
        totalStockValue: totalStockValue.rows[0].total_value || 0,
        lowStockItems: parseInt(lowStock.rows[0].count),
        outOfStockItems: parseInt(outOfStock.rows[0].count),
        warehouses: parseInt(warehouses.rows[0].count),
      },
      recentMovements: recentMovements.rows,
    })
  } catch (error) {
    console.error('Inventory summary error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}