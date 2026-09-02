export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/wavecore/auth'
import { pool } from '@/lib/wavecore/db'

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const orgId = session.organizationId

    // Complete inventory report
    const inventoryReport = await pool.query(`
      SELECT 
        p.id, p.name, p.sku, p.category, p.unit,
        p."costPrice", p."sellingPrice",
        p."minStock", p."maxStock",
        COALESCE(sq.quantity, 0) as "currentStock",
        COALESCE(sq."availableQty", 0) as "availableStock",
        COALESCE(sq."reservedQty", 0) as "reservedStock",
        p."costPrice" * COALESCE(sq.quantity, 0) as "costValue",
        p."sellingPrice" * COALESCE(sq.quantity, 0) as "sellingValue",
        (p."sellingPrice" - p."costPrice") * COALESCE(sq.quantity, 0) as "profitValue",
        CASE 
          WHEN COALESCE(sq.quantity, 0) = 0 THEN 'OUT_OF_STOCK'
          WHEN COALESCE(sq.quantity, 0) < p."minStock" THEN 'LOW_STOCK'
          WHEN COALESCE(sq.quantity, 0) > p."maxStock" THEN 'OVERSTOCKED'
          ELSE 'OPTIMAL'
        END as "stockStatus",
        p."createdAt"
      FROM "Product" p
      LEFT JOIN "StockQuantity" sq ON sq."productId" = p.id
      WHERE p."organizationId" = $1
      ORDER BY p.name ASC
    `, [orgId]).catch(() => ({ rows: [] }))

    // Summary statistics
    const summary = {
      totalProducts: inventoryReport.rows.length,
      totalStockUnits: inventoryReport.rows.reduce((sum, r) => sum + Number(r.currentStock || 0), 0),
      totalCostValue: inventoryReport.rows.reduce((sum, r) => sum + Number(r.costValue || 0), 0),
      totalSellingValue: inventoryReport.rows.reduce((sum, r) => sum + Number(r.sellingValue || 0), 0),
      totalProfitValue: inventoryReport.rows.reduce((sum, r) => sum + Number(r.profitValue || 0), 0),
      outOfStock: inventoryReport.rows.filter(r => r.stockStatus === 'OUT_OF_STOCK').length,
      lowStock: inventoryReport.rows.filter(r => r.stockStatus === 'LOW_STOCK').length,
      overstocked: inventoryReport.rows.filter(r => r.stockStatus === 'OVERSTOCKED').length,
      optimal: inventoryReport.rows.filter(r => r.stockStatus === 'OPTIMAL').length
    }

    return NextResponse.json({
      report: inventoryReport.rows,
      summary
    })
  } catch (error) {
    console.error('Reports error:', error)
    return NextResponse.json({ report: [], summary: { totalProducts: 0, totalStockUnits: 0, totalCostValue: 0, totalSellingValue: 0, totalProfitValue: 0, outOfStock: 0, lowStock: 0, overstocked: 0, optimal: 0 } })
  }
}