export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/wavecore/auth'
import { pool } from '@/lib/wavecore/db'

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const orgId = session.organizationId

    // Detect unusual movements (3-sigma rule)
    const movementAnomalies = await pool.query(`
      WITH movement_stats AS (
        SELECT "productId", AVG(quantity) as avg_qty, STDDEV(quantity) as stddev_qty
        FROM "StockMove"
        WHERE "organizationId" = $1 AND "createdAt" > NOW() - INTERVAL '30 days'
        GROUP BY "productId"
        HAVING STDDEV(quantity) > 0
      )
      SELECT sm.*, p.name as "productName",
        ms.avg_qty, ms.stddev_qty,
        CASE 
          WHEN ABS(sm.quantity - ms.avg_qty) > 3 * ms.stddev_qty THEN 'CRITICAL'
          WHEN ABS(sm.quantity - ms.avg_qty) > 2 * ms.stddev_qty THEN 'WARNING'
          ELSE 'NORMAL'
        END as "anomalyLevel"
      FROM "StockMove" sm
      JOIN "Product" p ON sm."productId" = p.id
      JOIN movement_stats ms ON sm."productId" = ms."productId"
      WHERE sm."organizationId" = $1
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
      SELECT DATE_TRUNC('day', "createdAt") as date,
        COUNT(*) as "adjustmentCount",
        SUM(quantity) as "totalAdjusted"
      FROM "StockMove"
      WHERE "organizationId" = $1 
        AND type IN ('ADJUSTMENT', 'DELIVERY', 'RECEIPT')
        AND "createdAt" > NOW() - INTERVAL '30 days'
      GROUP BY DATE_TRUNC('day', "createdAt")
      HAVING COUNT(*) > 10
      ORDER BY "adjustmentCount" DESC
      LIMIT 10
    `, [orgId]).catch(() => ({ rows: [] }))

    // Detect shrinkage (adjustments that reduce stock significantly)
    const shrinkage = await pool.query(`
      SELECT p.name, SUM(ABS(sm.quantity)) as "totalShrinkage"
      FROM "StockMove" sm
      JOIN "Product" p ON sm."productId" = p.id
      WHERE sm."organizationId" = $1
        AND sm.type = 'ADJUSTMENT'
        AND sm.quantity < 0
        AND sm."createdAt" > NOW() - INTERVAL '90 days'
      GROUP BY p.name
      ORDER BY "totalShrinkage" DESC
      LIMIT 10
    `, [orgId]).catch(() => ({ rows: [] }))

    const summary = {
      movementAnomalies: movementAnomalies.rows.length,
      negativeStock: negativeStock.rows.length,
      adjustmentAnomalies: adjustmentAnomalies.rows.length,
      shrinkageItems: shrinkage.rows.length,
      totalAnomalies: movementAnomalies.rows.length + negativeStock.rows.length + adjustmentAnomalies.rows.length + shrinkage.rows.length
    }

    return NextResponse.json({
      movementAnomalies: movementAnomalies.rows,
      negativeStock: negativeStock.rows,
      adjustmentAnomalies: adjustmentAnomalies.rows,
      shrinkage: shrinkage.rows,
      summary
    })
  } catch (error) {
    console.error('Anomaly error:', error)
    return NextResponse.json({ movementAnomalies: [], negativeStock: [], adjustmentAnomalies: [], shrinkage: [], summary: { movementAnomalies: 0, negativeStock: 0, adjustmentAnomalies: 0, shrinkageItems: 0, totalAnomalies: 0 } })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const id = searchParams.get('id')
    const productId = searchParams.get('productId')

    if (type === 'movement' && id) {
      // Delete the StockMove record (removes anomaly)
      await pool.query('DELETE FROM "StockMove" WHERE id = $1 AND "organizationId" = $2', [id, session.organizationId])
      return NextResponse.json({ success: true, message: 'Movement record deleted' })
    }

    if (type === 'negative' && productId) {
      // Fix negative stock to 0
      await pool.query('UPDATE "StockQuantity" SET quantity = 0, "availableQty" = 0, "updatedAt" = NOW() WHERE "productId" = $1', [productId])
      return NextResponse.json({ success: true, message: 'Negative stock fixed to 0' })
    }

    if (type === 'shrinkage' && productId) {
      // Delete shrinkage-type movements for that product
      await pool.query(`DELETE FROM "StockMove" WHERE "productId" = $1 AND "organizationId" = $2 AND type = 'ADJUSTMENT' AND quantity < 0`, [productId, session.organizationId])
      return NextResponse.json({ success: true, message: 'Shrinkage records deleted' })
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
  } catch (error) {
    console.error('Anomalies DELETE error:', error)
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
  }
}