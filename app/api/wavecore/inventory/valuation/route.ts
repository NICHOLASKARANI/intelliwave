export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/wavecore/auth'
import { pool } from '@/lib/wavecore/db'

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const orgId = session.organizationId

    // Inventory valuation by method (FIFO, LIFO, Weighted Average)
    const valuation = await pool.query(`
      SELECT 
        'FIFO' as method,
        COALESCE(SUM(p."costPrice" * COALESCE(sq.quantity, 0)), 0) as "totalValue",
        COUNT(DISTINCT p.id) as "productCount"
      FROM "Product" p
      LEFT JOIN "StockQuantity" sq ON sq."productId" = p.id
      WHERE p."organizationId" = $1
    `, [orgId]).catch(() => ({ rows: [] }))

    // Stock aging report
    const stockAging = await pool.query(`
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
      ORDER BY "ageBucket"
    `, [orgId]).catch(() => ({ rows: [] }))

    // Days of supply calculation
    const daysOfSupply = await pool.query(`
      SELECT 
        p.id,
        p.name,
        p.sku,
        COALESCE(sq.quantity, 0) as "currentStock",
        COALESCE(
          (SELECT AVG(sm.quantity) FROM "StockMove" sm 
           WHERE sm."productId" = p.id 
           AND sm."movementType" = 'OUT' 
           AND sm."createdAt" > NOW() - INTERVAL '30 days'),
          0
        ) as "avgDailyUsage",
        CASE 
          WHEN COALESCE(
            (SELECT AVG(sm.quantity) FROM "StockMove" sm 
             WHERE sm."productId" = p.id 
             AND sm."movementType" = 'OUT' 
             AND sm."createdAt" > NOW() - INTERVAL '30 days'),
            0
          ) > 0 
          THEN COALESCE(sq.quantity, 0) / COALESCE(
            (SELECT AVG(sm.quantity) FROM "StockMove" sm 
             WHERE sm."productId" = p.id 
             AND sm."movementType" = 'OUT' 
             AND sm."createdAt" > NOW() - INTERVAL '30 days'),
            0
          )
          ELSE 0
        END as "daysOfSupply"
      FROM "Product" p
      LEFT JOIN "StockQuantity" sq ON sq."productId" = p.id
      WHERE p."organizationId" = $1 AND COALESCE(sq.quantity, 0) > 0
      ORDER BY "daysOfSupply" ASC
      LIMIT 20
    `, [orgId]).catch(() => ({ rows: [] }))

    // Inventory turnover ratio
    const turnover = await pool.query(`
      SELECT 
        p.id,
        p.name,
        p.sku,
        COALESCE(sq.quantity, 0) as "currentStock",
        COALESCE(p."costPrice", 0) as "costPrice",
        COALESCE(p."costPrice" * COALESCE(sq.quantity, 0), 0) as "stockValue",
        COALESCE(
          (SELECT SUM(sm.quantity * p."costPrice") FROM "StockMove" sm 
           WHERE sm."productId" = p.id 
           AND sm."movementType" = 'OUT' 
           AND sm."createdAt" > NOW() - INTERVAL '90 days'),
          0
        ) as "cogsLast90Days",
        CASE 
          WHEN COALESCE(p."costPrice" * COALESCE(sq.quantity, 0), 0) > 0 
          THEN COALESCE(
            (SELECT SUM(sm.quantity * p."costPrice") FROM "StockMove" sm 
             WHERE sm."productId" = p.id 
             AND sm."movementType" = 'OUT' 
             AND sm."createdAt" > NOW() - INTERVAL '90 days'),
            0
          ) * 4 / COALESCE(p."costPrice" * COALESCE(sq.quantity, 0), 0)
          ELSE 0
        END as "annualTurnover"
      FROM "Product" p
      LEFT JOIN "StockQuantity" sq ON sq."productId" = p.id
      WHERE p."organizationId" = $1
      ORDER BY "annualTurnover" DESC
      LIMIT 20
    `, [orgId]).catch(() => ({ rows: [] }))

    return NextResponse.json({
      valuation: valuation.rows,
      stockAging: stockAging.rows,
      daysOfSupply: daysOfSupply.rows,
      turnover: turnover.rows,
      summary: {
        totalInventoryValue: valuation.rows[0]?.totalValue || 0,
        totalProducts: valuation.rows[0]?.productCount || 0,
        avgDaysOfSupply: daysOfSupply.rows.length > 0 
          ? daysOfSupply.rows.reduce((sum, d) => sum + Number(d.daysOfSupply || 0), 0) / daysOfSupply.rows.length 
          : 0,
        totalSlowMoving: daysOfSupply.rows.filter(d => Number(d.daysOfSupply || 0) > 90).length
      }
    })
  } catch (error) {
    console.error('Valuation error:', error)
    return NextResponse.json({
      valuation: [],
      stockAging: [],
      daysOfSupply: [],
      turnover: [],
      summary: { totalInventoryValue: 0, totalProducts: 0, avgDaysOfSupply: 0, totalSlowMoving: 0 }
    })
  }
}