export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/wavecore/auth'
import { pool } from '@/lib/wavecore/db'

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const orgId = session.organizationId

    // Stock turnover analysis (products with high vs low movement)
    const turnoverAnalysis = await pool.query(`
      SELECT 
        p.id,
        p.name,
        p.sku,
        COALESCE(sq.quantity, 0) as "currentStock",
        p."sellingPrice",
        p."costPrice",
        CASE 
          WHEN COALESCE(sq.quantity, 0) = 0 THEN 'DEAD_STOCK'
          WHEN p."minStock" IS NOT NULL AND COALESCE(sq.quantity, 0) < p."minStock" THEN 'CRITICAL'
          WHEN p."maxStock" IS NOT NULL AND COALESCE(sq.quantity, 0) > p."maxStock" THEN 'OVERSTOCKED'
          ELSE 'OPTIMAL'
        END as "stockHealth"
      FROM "Product" p
      LEFT JOIN "StockQuantity" sq ON sq."productId" = p.id
      WHERE p."organizationId" = $1
      ORDER BY CASE 
        WHEN COALESCE(sq.quantity, 0) = 0 THEN 0
        WHEN p."minStock" IS NOT NULL AND COALESCE(sq.quantity, 0) < p."minStock" THEN 1
        WHEN p."maxStock" IS NOT NULL AND COALESCE(sq.quantity, 0) > p."maxStock" THEN 3
        ELSE 2
      END
    `, [orgId]).catch(() => ({ rows: [] }))

    // ABC Analysis (Pareto principle - 80/20 rule)
    const abcAnalysis = await pool.query(`
      WITH ranked AS (
        SELECT 
          p.id,
          p.name,
          p.sku,
          COALESCE(p."sellingPrice" * COALESCE(sq.quantity, 0), 0) as "stockValue",
          SUM(COALESCE(p."sellingPrice" * COALESCE(sq.quantity, 0), 0)) OVER () as "totalValue"
        FROM "Product" p
        LEFT JOIN "StockQuantity" sq ON sq."productId" = p.id
        WHERE p."organizationId" = $1
      ),
      cumulative AS (
        SELECT 
          *,
          SUM("stockValue") OVER (ORDER BY "stockValue" DESC) as "cumulativeValue",
          SUM("stockValue") OVER (ORDER BY "stockValue" DESC) / NULLIF("totalValue", 0) * 100 as "cumulativePercentage"
        FROM ranked
      )
      SELECT 
        *,
        CASE 
          WHEN "cumulativePercentage" <= 80 THEN 'A'
          WHEN "cumulativePercentage" <= 95 THEN 'B'
          ELSE 'C'
        END as "abcClass"
      FROM cumulative
      ORDER BY "stockValue" DESC
    `, [orgId]).catch(() => ({ rows: [] }))

    // Stock movement trends (last 30 days)
    const movementTrends = await pool.query(`
      SELECT 
        DATE_TRUNC('day', sm."createdAt") as date,
        COUNT(*) as "movementCount",
        SUM(sm.quantity) as "totalQuantity",
        sm."movementType"
      FROM "StockMove" sm
      WHERE sm."organizationId" = $1
        AND sm."createdAt" >= NOW() - INTERVAL '30 days'
      GROUP BY DATE_TRUNC('day', sm."createdAt"), sm."movementType"
      ORDER BY date DESC
      LIMIT 50
    `, [orgId]).catch(() => ({ rows: [] }))

    // Dead stock (no movement in 90 days)
    const deadStock = await pool.query(`
      SELECT 
        p.id,
        p.name,
        p.sku,
        COALESCE(sq.quantity, 0) as "currentStock",
        p."sellingPrice",
        p."costPrice",
        COALESCE(p."costPrice" * COALESCE(sq.quantity, 0), 0) as "deadStockValue",
        MAX(sm."createdAt") as "lastMovement"
      FROM "Product" p
      LEFT JOIN "StockQuantity" sq ON sq."productId" = p.id
      LEFT JOIN "StockMove" sm ON sm."productId" = p.id
      WHERE p."organizationId" = $1
        AND COALESCE(sq.quantity, 0) > 0
      GROUP BY p.id, p.name, p.sku, sq.quantity, p."sellingPrice", p."costPrice"
      HAVING MAX(sm."createdAt") < NOW() - INTERVAL '90 days' OR MAX(sm."createdAt") IS NULL
      ORDER BY "deadStockValue" DESC
      LIMIT 20
    `, [orgId]).catch(() => ({ rows: [] }))

    const stockHealthCounts = {
      critical: turnoverAnalysis.rows.filter(r => r.stockHealth === 'CRITICAL').length,
      optimal: turnoverAnalysis.rows.filter(r => r.stockHealth === 'OPTIMAL').length,
      overstocked: turnoverAnalysis.rows.filter(r => r.stockHealth === 'OVERSTOCKED').length,
      deadStock: turnoverAnalysis.rows.filter(r => r.stockHealth === 'DEAD_STOCK').length
    }

    const abcCounts = {
      aClass: abcAnalysis.rows.filter(r => r.abcClass === 'A').length,
      bClass: abcAnalysis.rows.filter(r => r.abcClass === 'B').length,
      cClass: abcAnalysis.rows.filter(r => r.abcClass === 'C').length
    }

    const totalDeadStockValue = deadStock.rows.reduce((sum, d) => sum + Number(d.deadStockValue || 0), 0)

    return NextResponse.json({
      stockHealth: turnoverAnalysis.rows,
      stockHealthCounts,
      abcAnalysis: abcAnalysis.rows,
      abcCounts,
      movementTrends: movementTrends.rows,
      deadStock: deadStock.rows,
      totalDeadStockValue,
      insights: {
        criticalAlert: stockHealthCounts.critical > 0 ? `${stockHealthCounts.critical} products need immediate attention` : 'All products are adequately stocked',
        deadStockAlert: deadStock.rows.length > 0 ? `${deadStock.rows.length} dead stock items worth KSh ${totalDeadStockValue.toLocaleString()}` : 'No dead stock detected',
        optimalRate: turnoverAnalysis.rows.length > 0 ? `${((stockHealthCounts.optimal / turnoverAnalysis.rows.length) * 100).toFixed(1)}% of inventory is at optimal levels` : 'No inventory data',
        abcInsight: abcCounts.aClass > 0 ? `${abcCounts.aClass} A-class items represent 80% of stock value` : 'No ABC analysis available'
      }
    })
  } catch (error) {
    console.error('Inventory Analytics error:', error)
    return NextResponse.json({
      stockHealth: [],
      stockHealthCounts: { critical: 0, optimal: 0, overstocked: 0, deadStock: 0 },
      abcAnalysis: [],
      abcCounts: { aClass: 0, bClass: 0, cClass: 0 },
      movementTrends: [],
      deadStock: [],
      totalDeadStockValue: 0,
      insights: {
        criticalAlert: 'Unable to load analytics',
        deadStockAlert: 'Unable to load analytics',
        optimalRate: 'Unable to load analytics',
        abcInsight: 'Unable to load analytics'
      }
    })
  }
}