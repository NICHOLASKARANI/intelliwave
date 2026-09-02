export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/wavecore/auth'
import { pool } from '@/lib/wavecore/db'

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const orgId = session.organizationId

    // Critical alerts
    const criticalAlerts = await pool.query(`
      SELECT 
        p.id,
        p.name,
        p.sku,
        COALESCE(sq.quantity, 0) as "currentStock",
        p."minStock",
        'CRITICAL' as "alertType",
        CASE 
          WHEN COALESCE(sq.quantity, 0) = 0 THEN 'Out of Stock'
          WHEN COALESCE(sq.quantity, 0) < p."minStock" THEN 'Below Reorder Level'
          ELSE 'Low Stock'
        END as "alertMessage",
        p."createdAt"
      FROM "Product" p
      LEFT JOIN "StockQuantity" sq ON sq."productId" = p.id
      WHERE p."organizationId" = $1
        AND COALESCE(sq.quantity, 0) < COALESCE(p."minStock", 10)
      ORDER BY COALESCE(sq.quantity, 0) ASC
      LIMIT 10
    `, [orgId]).catch(() => ({ rows: [] }))

    // Overstock alerts
    const overstockAlerts = await pool.query(`
      SELECT 
        p.id,
        p.name,
        p.sku,
        COALESCE(sq.quantity, 0) as "currentStock",
        p."maxStock",
        'OVERSTOCK' as "alertType",
        'Above Maximum Level' as "alertMessage"
      FROM "Product" p
      LEFT JOIN "StockQuantity" sq ON sq."productId" = p.id
      WHERE p."organizationId" = $1
        AND p."maxStock" IS NOT NULL
        AND COALESCE(sq.quantity, 0) > p."maxStock"
      ORDER BY COALESCE(sq.quantity, 0) DESC
      LIMIT 10
    `, [orgId]).catch(() => ({ rows: [] }))

    return NextResponse.json({
      criticalAlerts: criticalAlerts.rows,
      overstockAlerts: overstockAlerts.rows,
      totalAlerts: criticalAlerts.rows.length + overstockAlerts.rows.length
    })
  } catch (error) {
    console.error('Inventory Alerts error:', error)
    return NextResponse.json({
      criticalAlerts: [],
      overstockAlerts: [],
      totalAlerts: 0
    })
  }
}