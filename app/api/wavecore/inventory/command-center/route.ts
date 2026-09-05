export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/wavecore/auth'
import { pool } from '@/lib/wavecore/db'

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const orgId = session.organizationId

    const [products, stockValue, warehouses, lowStock, outOfStock, movements24h] = await Promise.all([
      pool.query('SELECT COUNT(*) as count FROM "Product" WHERE "organizationId" = $1', [orgId]).catch(() => ({ rows: [{ count: 0 }] })),
      pool.query('SELECT COALESCE(SUM(p."sellingPrice" * COALESCE(sq.quantity, 0)), 0) as "sellingValue", COALESCE(SUM(p."costPrice" * COALESCE(sq.quantity, 0)), 0) as "costValue", COALESCE(SUM(COALESCE(sq.quantity, 0)), 0) as "totalUnits" FROM "Product" p LEFT JOIN "StockQuantity" sq ON sq."productId" = p.id WHERE p."organizationId" = $1', [orgId]).catch(() => ({ rows: [{ sellingValue: 0, costValue: 0, totalUnits: 0 }] })),
      pool.query('SELECT COUNT(*) as count FROM "Warehouse" WHERE "organizationId" = $1', [orgId]).catch(() => ({ rows: [{ count: 0 }] })),
      pool.query('SELECT COUNT(*) as count FROM "Product" p LEFT JOIN "StockQuantity" sq ON sq."productId" = p.id WHERE p."organizationId" = $1 AND COALESCE(sq.quantity, 0) < COALESCE(p."minStock", 10) AND COALESCE(sq.quantity, 0) > 0', [orgId]).catch(() => ({ rows: [{ count: 0 }] })),
      pool.query('SELECT COUNT(*) as count FROM "Product" p LEFT JOIN "StockQuantity" sq ON sq."productId" = p.id WHERE p."organizationId" = $1 AND COALESCE(sq.quantity, 0) = 0', [orgId]).catch(() => ({ rows: [{ count: 0 }] })),
      pool.query('SELECT COUNT(*) as count FROM "StockMove" sm WHERE sm."organizationId" = $1 AND sm."createdAt" > NOW() - INTERVAL \'24 hours\'', [orgId]).catch(() => ({ rows: [{ count: 0 }] }))
    ])

    const recentMovements = await pool.query('SELECT sm.*, p.name as "productName" FROM "StockMove" sm LEFT JOIN "Product" p ON p.id = sm."productId" WHERE sm."organizationId" = $1 ORDER BY sm."createdAt" DESC LIMIT 10', [orgId]).catch(() => ({ rows: [] }))

    const lowStockProducts = await pool.query('SELECT p.id, p.name, p.sku, COALESCE(sq.quantity, 0) as "currentStock", p."minStock" FROM "Product" p LEFT JOIN "StockQuantity" sq ON sq."productId" = p.id WHERE p."organizationId" = $1 AND COALESCE(sq.quantity, 0) < COALESCE(p."minStock", 10) ORDER BY COALESCE(sq.quantity, 0) ASC LIMIT 10', [orgId]).catch(() => ({ rows: [] }))

    const kpis = {
      totalProducts: Number(products.rows[0]?.count || 0),
      totalUnits: Number(stockValue.rows[0]?.totalUnits || 0),
      totalSellingValue: Number(stockValue.rows[0]?.sellingValue || 0),
      totalCostValue: Number(stockValue.rows[0]?.costValue || 0),
      grossMargin: Number(stockValue.rows[0]?.sellingValue || 0) - Number(stockValue.rows[0]?.costValue || 0),
      totalWarehouses: Number(warehouses.rows[0]?.count || 0),
      lowStockCount: Number(lowStock.rows[0]?.count || 0),
      outOfStockCount: Number(outOfStock.rows[0]?.count || 0),
      movements24h: Number(movements24h.rows[0]?.count || 0)
    }

    return NextResponse.json({ kpis, recentMovements: recentMovements.rows, lowStockProducts: lowStockProducts.rows })
  } catch (error) {
    console.error('Command Center error:', error)
    return NextResponse.json({ kpis: { totalProducts: 0, totalUnits: 0, totalSellingValue: 0, totalCostValue: 0, grossMargin: 0, totalWarehouses: 0, lowStockCount: 0, outOfStockCount: 0, movements24h: 0 }, recentMovements: [], lowStockProducts: [] })
  }
}