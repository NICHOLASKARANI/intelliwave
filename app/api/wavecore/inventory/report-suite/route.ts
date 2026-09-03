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
    const reportType = searchParams.get('type') || 'stock-summary'

    let result: any = { reportType }

    if (reportType === 'stock-summary') {
      const stock = await pool.query(`
        SELECT 
          p.id, p.name, p.sku, p.category,
          p."costPrice", p."sellingPrice",
          p."minStock", p."maxStock",
          COALESCE(sq.quantity, 0) as "onHand",
          COALESCE(sq."availableQty", 0) as "available",
          COALESCE(sq."reservedQty", 0) as "reserved",
          p."costPrice" * COALESCE(sq.quantity, 0) as "costValue",
          p."sellingPrice" * COALESCE(sq.quantity, 0) as "sellingValue"
        FROM "Product" p
        LEFT JOIN "StockQuantity" sq ON sq."productId" = p.id
        WHERE p."organizationId" = $1
        ORDER BY p.name ASC
      `, [orgId]).catch(() => ({ rows: [] }))
      
      result.data = stock.rows
      result.summary = {
        totalProducts: stock.rows.length,
        totalOnHand: stock.rows.reduce((s, r) => s + Number(r.onHand || 0), 0),
        totalAvailable: stock.rows.reduce((s, r) => s + Number(r.available || 0), 0),
        totalReserved: stock.rows.reduce((s, r) => s + Number(r.reserved || 0), 0),
        totalCostValue: stock.rows.reduce((s, r) => s + Number(r.costValue || 0), 0),
        totalSellingValue: stock.rows.reduce((s, r) => s + Number(r.sellingValue || 0), 0)
      }
    }

    if (reportType === 'movement-history') {
      const movements = await pool.query(`
        SELECT sm.*, p.name as "productName", p.sku
        FROM "StockMove" sm
        LEFT JOIN "Product" p ON sm."productId" = p.id
        WHERE sm."organizationId" = $1
        ORDER BY sm."createdAt" DESC
        LIMIT 200
      `, [orgId]).catch(() => ({ rows: [] }))
      
      result.data = movements.rows
      result.summary = {
        totalMovements: movements.rows.length,
        byType: movements.rows.reduce((acc, m) => {
          acc[m.movementType || 'UNKNOWN'] = (acc[m.movementType || 'UNKNOWN'] || 0) + 1
          return acc
        }, {})
      }
    }

    if (reportType === 'valuation-report') {
      const valuation = await pool.query(`
        SELECT 
          'FIFO' as method,
          COALESCE(SUM(p."costPrice" * COALESCE(sq.quantity, 0)), 0) as "totalValue",
          COUNT(DISTINCT p.id) as "productCount"
        FROM "Product" p
        LEFT JOIN "StockQuantity" sq ON sq."productId" = p.id
        WHERE p."organizationId" = $1
      `, [orgId]).catch(() => ({ rows: [] }))
      
      result.data = valuation.rows
      result.summary = valuation.rows[0] || { totalValue: 0, productCount: 0 }
    }

    if (reportType === 'aging-report') {
      const aging = await pool.query(`
        SELECT 
          CASE 
            WHEN p."createdAt" > NOW() - INTERVAL '30 days' THEN '0-30 days'
            WHEN p."createdAt" > NOW() - INTERVAL '60 days' THEN '31-60 days'
            WHEN p."createdAt" > NOW() - INTERVAL '90 days' THEN '61-90 days'
            ELSE '90+ days'
          END as "ageBucket",
          COUNT(*) as "productCount",
          COALESCE(SUM(sq.quantity), 0) as "totalQuantity",
          COALESCE(SUM(p."costPrice" * COALESCE(sq.quantity, 0)), 0) as "stockValue"
        FROM "Product" p
        LEFT JOIN "StockQuantity" sq ON sq."productId" = p.id
        WHERE p."organizationId" = $1 AND COALESCE(sq.quantity, 0) > 0
        GROUP BY "ageBucket"
      `, [orgId]).catch(() => ({ rows: [] }))
      
      result.data = aging.rows
    }

    if (reportType === 'turnover-report') {
      const turnover = await pool.query(`
        SELECT 
          p.id, p.name, p.sku,
          COALESCE(sq.quantity, 0) as "currentStock",
          p."costPrice",
          COALESCE(p."costPrice" * COALESCE(sq.quantity, 0), 0) as "stockValue",
          COALESCE((SELECT SUM(sm.quantity * p."costPrice") FROM "StockMove" sm 
           WHERE sm."productId" = p.id AND sm."movementType" = 'OUT' 
           AND sm."createdAt" > NOW() - INTERVAL '90 days'), 0) as "cogs90Days"
        FROM "Product" p
        LEFT JOIN "StockQuantity" sq ON sq."productId" = p.id
        WHERE p."organizationId" = $1
        ORDER BY "cogs90Days" DESC
        LIMIT 50
      `, [orgId]).catch(() => ({ rows: [] }))
      
      result.data = turnover.rows.map((r: any) => ({
        ...r,
        annualTurnover: Number(r.stockValue) > 0 ? (Number(r.cogs90Days) * 4 / Number(r.stockValue)).toFixed(2) : 0
      }))
    }

    if (reportType === 'shrinkage-report') {
      const shrinkage = await pool.query(`
        SELECT 
          DATE_TRUNC('month', sm."createdAt") as month,
          sm."movementType",
          SUM(ABS(sm.quantity)) as "totalQuantity",
          COUNT(*) as "transactionCount"
        FROM "StockMove" sm
        WHERE sm."organizationId" = $1
          AND sm."movementType" IN ('ADJUSTMENT', 'WRITE_OFF', 'DAMAGE', 'EXPIRY', 'THEFT')
        GROUP BY DATE_TRUNC('month', sm."createdAt"), sm."movementType"
        ORDER BY month DESC
        LIMIT 50
      `, [orgId]).catch(() => ({ rows: [] }))
      
      result.data = shrinkage.rows
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Report Suite error:', error)
    return NextResponse.json({ reportType, data: [], summary: {} })
  }
}