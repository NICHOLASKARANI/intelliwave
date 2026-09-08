export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/wavecore/auth'
import { pool } from '@/lib/wavecore/db'

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const orgId = session.organizationId

    // Get all products with stock and movement history
    const products = await pool.query(`
      SELECT 
        p.id, p.name, p.sku, p."sellingPrice", p."costPrice",
        COALESCE(sq.quantity, 0) as "currentStock",
        p."minStock", p."maxStock"
      FROM "Product" p
      LEFT JOIN "StockQuantity" sq ON sq."productId" = p.id
      WHERE p."organizationId" = $1
      ORDER BY p.name ASC
    `, [orgId]).catch(() => ({ rows: [] }))

    const forecasts = []

    for (const product of products.rows) {
      // Get last 90 days of OUT movements
      const movements = await pool.query(`
        SELECT 
          DATE_TRUNC('day', "createdAt") as date,
          SUM(quantity) as "dailyQuantity"
        FROM "StockMove"
        WHERE "productId" = $1 
          AND "organizationId" = $2
          AND type = 'DELIVERY'
          AND "createdAt" >= NOW() - INTERVAL '90 days'
        GROUP BY DATE_TRUNC('day', "createdAt")
        ORDER BY date ASC
      `, [product.id, orgId]).catch(() => ({ rows: [] }))

      const dailyQuantities = movements.rows.map((r: any) => Number(r.dailyQuantity || 0))
      const totalDemand90d = dailyQuantities.reduce((a, b) => a + b, 0)
      const avgDailyDemand = dailyQuantities.length > 0 ? totalDemand90d / 90 : 0
      const avgWeeklyDemand = avgDailyDemand * 7
      const avgMonthlyDemand = avgDailyDemand * 30

      // Calculate trend (linear regression)
      const n = dailyQuantities.length
      let slope = 0
      if (n > 1) {
        const indices = Array.from({length: n}, (_, i) => i)
        const avgX = indices.reduce((a, b) => a + b, 0) / n
        const avgY = avgDailyDemand
        let num = 0, den = 0
        for (let i = 0; i < n; i++) {
          num += (indices[i] - avgX) * (dailyQuantities[i] - avgY)
          den += (indices[i] - avgX) * (indices[i] - avgX)
        }
        slope = den !== 0 ? num / den : 0
      }

      // Forecast next 30 days
      const forecast30 = Math.max(0, Math.round((avgDailyDemand + slope * 30) * 30))
      const forecast7 = Math.max(0, Math.round((avgDailyDemand + slope * 7) * 7))

      // Days of supply
      const daysOfSupply = avgDailyDemand > 0 
        ? Math.round(Number(product.currentStock || 0) / avgDailyDemand) 
        : 999

      // Stockout prediction
      const willStockout = avgDailyDemand > 0 && daysOfSupply < 14
      const estimatedStockoutDate = willStockout && avgDailyDemand > 0
        ? new Date(Date.now() + daysOfSupply * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        : null

      forecasts.push({
        productId: product.id,
        name: product.name,
        sku: product.sku,
        currentStock: Number(product.currentStock || 0),
        minStock: Number(product.minStock || 10),
        maxStock: Number(product.maxStock || 100),
        sellingPrice: Number(product.sellingPrice || 0),
        avgDailyDemand: Math.round(avgDailyDemand * 100) / 100,
        avgWeeklyDemand: Math.round(avgWeeklyDemand),
        avgMonthlyDemand: Math.round(avgMonthlyDemand),
        trend: slope > 0.01 ? 'UP' : slope < -0.01 ? 'DOWN' : 'STABLE',
        forecast7,
        forecast30,
        daysOfSupply,
        willStockout,
        estimatedStockoutDate,
        confidence: dailyQuantities.length > 5 ? 'HIGH' : dailyQuantities.length > 2 ? 'MEDIUM' : 'LOW'
      })
    }

    // Summary
    const summary = {
      totalProducts: forecasts.length,
      willStockout: forecasts.filter(f => f.willStockout).length,
      trendingUp: forecasts.filter(f => f.trend === 'UP').length,
      trendingDown: forecasts.filter(f => f.trend === 'DOWN').length,
      stable: forecasts.filter(f => f.trend === 'STABLE').length,
      highConfidence: forecasts.filter(f => f.confidence === 'HIGH').length,
      totalForecast30: forecasts.reduce((s, f) => s + f.forecast30, 0)
    }

    return NextResponse.json({ forecasts, summary })
  } catch (error) {
    console.error('Forecasting error:', error)
    return NextResponse.json({ forecasts: [], summary: { totalProducts: 0, willStockout: 0, trendingUp: 0, trendingDown: 0, stable: 0, highConfidence: 0, totalForecast30: 0 } })
  }
}