export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/wavecore/auth'
import { pool } from '@/lib/wavecore/db'

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const orgId = session.organizationId

    // Get all products with age buckets
    const products = await pool.query(`
      SELECT 
        p.id, p.name, p.sku, p."costPrice", p."sellingPrice",
        COALESCE(sq.quantity, 0) as "currentStock",
        p."createdAt",
        CASE 
          WHEN p."createdAt" > NOW() - INTERVAL '30 days' THEN '0-30 days'
          WHEN p."createdAt" > NOW() - INTERVAL '60 days' THEN '31-60 days'
          WHEN p."createdAt" > NOW() - INTERVAL '90 days' THEN '61-90 days'
          WHEN p."createdAt" > NOW() - INTERVAL '180 days' THEN '91-180 days'
          ELSE '180+ days'
        END as "ageBucket",
        p."costPrice" * COALESCE(sq.quantity, 0) as "totalCost",
        NOW() - p."createdAt" as "ageDuration"
      FROM "Product" p
      LEFT JOIN "StockQuantity" sq ON sq."productId" = p.id
      WHERE p."organizationId" = $1 AND COALESCE(sq.quantity, 0) > 0
      ORDER BY p."createdAt" ASC
    `, [orgId]).catch(() => ({ rows: [] }))

    const productList = products.rows

    // Calculate days in inventory
    const withDays = productList.map(p => {
      const created = new Date(p.createdAt)
      const now = new Date()
      const daysInInventory = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24))
      return { ...p, daysInInventory }
    })

    // Summary
    const summary = {
      totalProducts: withDays.length,
      totalUnits: withDays.reduce((s, p) => s + Number(p.currentStock || 0), 0),
      totalValue: Math.round(withDays.reduce((s, p) => s + Number(p.totalCost || 0), 0) * 100) / 100,
      bucket0to30: withDays.filter(p => p.daysInInventory <= 30).length,
      bucket31to60: withDays.filter(p => p.daysInInventory > 30 && p.daysInInventory <= 60).length,
      bucket61to90: withDays.filter(p => p.daysInInventory > 60 && p.daysInInventory <= 90).length,
      bucket91to180: withDays.filter(p => p.daysInInventory > 90 && p.daysInInventory <= 180).length,
      bucket180plus: withDays.filter(p => p.daysInInventory > 180).length,
      slowMoving: withDays.filter(p => p.daysInInventory > 90).length,
      deadStock: withDays.filter(p => p.daysInInventory > 180).length
    }

    return NextResponse.json({ products: withDays, summary })
  } catch (error) {
    console.error('Stock Aging error:', error)
    return NextResponse.json({ products: [], summary: { totalProducts: 0, totalUnits: 0, totalValue: 0, bucket0to30: 0, bucket31to60: 0, bucket61to90: 0, bucket91to180: 0, bucket180plus: 0, slowMoving: 0, deadStock: 0 } })
  }
}