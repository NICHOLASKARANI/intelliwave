export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/wavecore/auth'
import { pool } from '@/lib/wavecore/db'

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const orgId = session.organizationId

    // Detect anomalies in stock movements
    const movementAnomalies = await pool.query(`
      WITH movement_stats AS (
        SELECT 
          "productId",
          AVG(quantity) as avg_qty,
          STDDEV(quantity) as stddev_qty
        FROM "StockMove"
        WHERE "organizationId" = $1 AND "createdAt" > NOW() - INTERVAL '30 days'
        GROUP BY "productId"
      )
      SELECT 
        sm.id, sm."productId", p.name as "productName",
        sm.quantity, ms.avg_qty, ms.stddev_qty,
        sm."movementType", sm."createdAt",
        CASE 
          WHEN ABS(sm.quantity - ms.avg_qty) > 3 * ms.stddev_qty THEN 'CRITICAL_ANOMALY'
          WHEN ABS(sm.quantity - ms.avg_qty) > 2 * ms.stddev_qty THEN 'WARNING'
          ELSE 'NORMAL'
        END as "anomalyLevel"
      FROM "StockMove" sm
      JOIN "Product" p ON sm."productId" = p.id
      JOIN movement_stats ms ON sm."productId" = ms."productId"
      WHERE sm."organizationId" = $1
        AND sm."createdAt" > NOW() - INTERVAL '7 days'
        AND ms.stddev_qty > 0
        AND ABS(sm.quantity - ms.avg_qty) > 2 * ms.stddev_qty
      ORDER BY ABS(sm.quantity - ms.avg_qty) DESC
      LIMIT 20
    `, [orgId]).catch(() => ({ rows: [] }))

    // Detect negative stock
    const negativeStock = await pool.query(`
      SELECT p.id, p.name, p.sku, COALESCE(sq.quantity, 0) as "quantity"
      FROM "Product" p
      LEFT JOIN "StockQuantity" sq ON sq."productId" = p.id
      WHERE p."organizationId" = $1 AND COALESCE(sq.quantity, 0) < 0
    `, [orgId]).catch(() => ({ rows: [] }))

    // Detect unusual adjustment patterns
    const adjustmentAnomalies = await pool.query(`
      SELECT 
        DATE_TRUNC('day', "createdAt") as date,
        COUNT(*) as "adjustmentCount",
        SUM(quantity) as "totalAdjusted"
      FROM "StockMove"
      WHERE "organizationId" = $1 
        AND "movementType" IN ('ADJUSTMENT', 'WRITE_OFF', 'DAMAGE')
        AND "createdAt" > NOW() - INTERVAL '30 days'
      GROUP BY DATE_TRUNC('day', "createdAt")
      HAVING COUNT(*) > 10
      ORDER BY "adjustmentCount" DESC
      LIMIT 10
    `, [orgId]).catch(() => ({ rows: [] }))

    const summary = {
      movementAnomalies: movementAnomalies.rows.length,
      negativeStock: negativeStock.rows.length,
      adjustmentAnomalies: adjustmentAnomalies.rows.length,
      totalAnomalies: movementAnomalies.rows.length + negativeStock.rows.length + adjustmentAnomalies.rows.length
    }

    return NextResponse.json({
      movementAnomalies: movementAnomalies.rows,
      negativeStock: negativeStock.rows,
      adjustmentAnomalies: adjustmentAnomalies.rows,
      summary
    })
  } catch (error) {
    console.error('Anomaly error:', error)
    return NextResponse.json({ movementAnomalies: [], negativeStock: [], adjustmentAnomalies: [], summary: { movementAnomalies: 0, negativeStock: 0, adjustmentAnomalies: 0, totalAnomalies: 0 } })
  }
}