export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/wavecore/auth'
import { pool } from '@/lib/wavecore/db'

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Get products with cost price and selling price
    const productsResult = await pool.query(`
      SELECT 
        p.id,
        p.name,
        p.sku,
        p."sellingPrice",
        p."costPrice",
        p.stock_level,
        p.category,
        (p."sellingPrice" - COALESCE(p."costPrice", 0)) as "profitPerUnit",
        ((p."sellingPrice" - COALESCE(p."costPrice", 0)) * p.stock_level) as "potentialProfit",
        p."createdAt"
      FROM "Product" p
      WHERE p."organizationId" = $1
      ORDER BY ((p."sellingPrice" - COALESCE(p."costPrice", 0)) * p.stock_level) DESC
    `, [session.organizationId])

    // Get sales data
    const salesResult = await pool.query(`
      SELECT 
        s.id,
        s.number,
        s.total,
        s."createdAt",
        s.status
      FROM "Sale" s
      WHERE s."organizationId" = $1
      ORDER BY s."createdAt" DESC
      LIMIT 100
    `, [session.organizationId]).catch(() => ({ rows: [] }))

    const products = productsResult.rows
    const sales = salesResult.rows

    // Calculate profit metrics
    const totalRevenue = sales.reduce((sum, s) => sum + Number(s.total || 0), 0)
    const totalCostValue = products.reduce((sum, p) => sum + (Number(p.costPrice || 0) * Number(p.stock_level || 0)), 0)
    const totalSellingValue = products.reduce((sum, p) => sum + (Number(p.sellingPrice || 0) * Number(p.stock_level || 0)), 0)
    const totalPotentialProfit = totalSellingValue - totalCostValue
    const profitMargin = totalSellingValue > 0 ? (totalPotentialProfit / totalSellingValue) * 100 : 0

    // High profit products (margin > 30%)
    const highProfitProducts = products.filter(p => {
      const costPrice = Number(p.costPrice || 0)
      const sellingPrice = Number(p.sellingPrice || 0)
      if (costPrice === 0 || sellingPrice === 0) return false
      return ((sellingPrice - costPrice) / sellingPrice) * 100 > 30
    }).length

    // Low profit products (margin < 10%)
    const lowProfitProducts = products.filter(p => {
      const costPrice = Number(p.costPrice || 0)
      const sellingPrice = Number(p.sellingPrice || 0)
      if (costPrice === 0 || sellingPrice === 0) return false
      return ((sellingPrice - costPrice) / sellingPrice) * 100 < 10
    }).length

    return NextResponse.json({ 
      products,
      sales,
      stats: {
        totalRevenue,
        totalCostValue,
        totalSellingValue,
        totalPotentialProfit,
        profitMargin,
        highProfitProducts,
        lowProfitProducts,
        totalProducts: products.length,
        totalSales: sales.length
      }
    })
  } catch (error) {
    console.error('Profit GET error:', error)
    return NextResponse.json({ 
      products: [], 
      sales: [], 
      stats: {
        totalRevenue: 0,
        totalCostValue: 0,
        totalSellingValue: 0,
        totalPotentialProfit: 0,
        profitMargin: 0,
        highProfitProducts: 0,
        lowProfitProducts: 0,
        totalProducts: 0,
        totalSales: 0
      }
    })
  }
}