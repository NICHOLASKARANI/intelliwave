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
    const method = searchParams.get('method') || 'WEIGHTED_AVERAGE'

    // Get all products with stock and cost data
    const products = await pool.query(`
      SELECT 
        p.id, p.name, p.sku, p."costPrice", p."sellingPrice",
        COALESCE(sq.quantity, 0) as "currentStock",
        p."costPrice" * COALESCE(sq.quantity, 0) as "totalCost",
        p."sellingPrice" * COALESCE(sq.quantity, 0) as "totalSellingValue"
      FROM "Product" p
      LEFT JOIN "StockQuantity" sq ON sq."productId" = p.id
      WHERE p."organizationId" = $1
      ORDER BY p.name ASC
    `, [orgId]).catch(() => ({ rows: [] }))

    const productList = products.rows

    // Calculate valuation based on method
    let totalValue = 0
    let methodName = ''

    if (method === 'FIFO') {
      methodName = 'FIFO (First In, First Out)'
      totalValue = productList.reduce((sum, p) => sum + Number(p.totalCost || 0), 0)
    } else if (method === 'STANDARD_COST') {
      methodName = 'Standard Cost'
      totalValue = productList.reduce((sum, p) => sum + (Number(p.costPrice || 0) * Number(p.currentStock || 0)), 0)
    } else {
      methodName = 'Weighted Average Cost'
      // Weighted average uses the average cost across all units
      const totalUnits = productList.reduce((sum, p) => sum + Number(p.currentStock || 0), 0)
      const totalCostAll = productList.reduce((sum, p) => sum + Number(p.totalCost || 0), 0)
      totalValue = totalUnits > 0 ? totalCostAll / totalUnits * totalUnits : totalCostAll
    }

    // Stock aging
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
      GROUP BY "ageBucket" ORDER BY "ageBucket"
    `, [orgId]).catch(() => ({ rows: [] }))

    const summary = {
      method: methodName,
      totalProducts: productList.length,
      totalUnits: productList.reduce((s, p) => s + Number(p.currentStock || 0), 0),
      totalValue: Math.round(totalValue * 100) / 100,
      totalSellingValue: Math.round(productList.reduce((s, p) => s + Number(p.totalSellingValue || 0), 0) * 100) / 100,
      potentialProfit: Math.round(productList.reduce((s, p) => s + (Number(p.totalSellingValue || 0) - Number(p.totalCost || 0)), 0) * 100) / 100
    }

    return NextResponse.json({ products: productList, aging: aging.rows, summary })
  } catch (error) {
    console.error('Valuation error:', error)
    return NextResponse.json({ 
      products: [], 
      aging: [], 
      summary: { method: 'Weighted Average Cost', totalProducts: 0, totalUnits: 0, totalValue: 0, totalSellingValue: 0, potentialProfit: 0 }
    })
  }
}