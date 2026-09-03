export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/wavecore/auth'
import { pool } from '@/lib/wavecore/db'

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const orgId = session.organizationId
    const { searchParams } = new URL(request.url)
    const serviceLevel = parseFloat(searchParams.get('serviceLevel') || '95')
    const leadTimeDays = parseInt(searchParams.get('leadTimeDays') || '7')

    // Z-score for service level (common values)
    const zScores: Record<number, number> = {
      90: 1.28, 95: 1.645, 97: 1.88, 98: 2.05, 99: 2.33
    }
    const zScore = zScores[serviceLevel] || 1.645

    // Calculate safety stock for each product
    const products = await pool.query(`
      SELECT 
        p.id, p.name, p.sku,
        COALESCE(sq.quantity, 0) as "currentStock",
        p."minStock",
        p."maxStock",
        p."sellingPrice",
        p."costPrice",
        p.category
      FROM "Product" p
      LEFT JOIN "StockQuantity" sq ON sq."productId" = p.id
      WHERE p."organizationId" = $1
    `, [orgId]).catch(() => ({ rows: [] }))

    const safetyStockResults = []
    for (const product of products.rows) {
      // Get demand history
      const history = await pool.query(`
        SELECT COALESCE(STDDEV(sm.quantity), 0) as "stdDev",
               COALESCE(AVG(sm.quantity), 0) as "avgDemand"
        FROM "StockMove" sm
        WHERE sm."productId" = $1 
          AND sm."organizationId" = $2
          AND sm."movementType" = 'OUT'
          AND sm."createdAt" >= NOW() - INTERVAL '30 days'
      `, [product.id, orgId]).catch(() => ({ rows: [{ stdDev: 0, avgDemand: 0 }] }))

      const stdDev = Number(history.rows[0]?.stdDev || 0)
      const avgDemand = Number(history.rows[0]?.avgDemand || 0)
      
      // Safety Stock = Z-score × StdDev × √LeadTime
      const safetyStock = Math.ceil(zScore * stdDev * Math.sqrt(leadTimeDays))
      
      // Reorder Point = Avg Daily Demand × Lead Time + Safety Stock
      const dailyDemand = avgDemand
      const reorderPoint = Math.ceil(dailyDemand * leadTimeDays + safetyStock)

      // Economic Order Quantity (EOQ)
      // EOQ = √(2 × Annual Demand × Order Cost / Holding Cost)
      const annualDemand = dailyDemand * 365
      const orderCost = 100 // Estimated order cost
      const holdingCost = Number(product.costPrice || 0) * 0.25 // 25% holding cost
      const eoq = holdingCost > 0 ? Math.ceil(Math.sqrt(2 * annualDemand * orderCost / holdingCost)) : 0

      safetyStockResults.push({
        productId: product.id,
        name: product.name,
        sku: product.sku,
        category: product.category,
        currentStock: Number(product.currentStock || 0),
        minStock: Number(product.minStock || 0),
        maxStock: Number(product.maxStock || 0),
        avgDailyDemand: Math.round(dailyDemand * 100) / 100,
        stdDevDemand: Math.round(stdDev * 100) / 100,
        safetyStock,
        reorderPoint,
        eoq,
        needsReorder: Number(product.currentStock || 0) < reorderPoint,
        gap: Math.max(0, reorderPoint - Number(product.currentStock || 0))
      })
    }

    return NextResponse.json({
      safetyStockResults,
      params: { serviceLevel, leadTimeDays, zScore },
      summary: {
        totalProducts: safetyStockResults.length,
        needsReorder: safetyStockResults.filter(p => p.needsReorder).length,
        totalGap: safetyStockResults.reduce((sum, p) => sum + p.gap, 0),
        totalSafetyStockValue: Math.round(safetyStockResults.reduce((sum, p) => sum + p.safetyStock * Number(p.costPrice || 0), 0) * 100) / 100
      }
    })
  } catch (error) {
    console.error('Safety Stock error:', error)
    return NextResponse.json({ safetyStockResults: [], params: { serviceLevel, leadTimeDays, zScore }, summary: { totalProducts: 0, needsReorder: 0, totalGap: 0, totalSafetyStockValue: 0 } })
  }
}