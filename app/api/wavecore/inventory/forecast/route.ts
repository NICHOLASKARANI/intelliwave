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
    const productId = searchParams.get('productId')
    const days = parseInt(searchParams.get('days') || '30')

    if (productId) {
      // Forecast for specific product using moving average + trend
      const salesHistory = await pool.query(`
        SELECT 
          DATE_TRUNC('day', sm."createdAt") as date,
          SUM(sm.quantity) as "dailyQuantity"
        FROM "StockMove" sm
        WHERE sm."productId" = $1 
          AND sm."organizationId" = $2
          AND sm."movementType" = 'OUT'
          AND sm."createdAt" >= NOW() - INTERVAL '90 days'
        GROUP BY DATE_TRUNC('day', sm."createdAt")
        ORDER BY date ASC
      `, [productId, orgId]).catch(() => ({ rows: [] }))

      const dailyQuantities = salesHistory.rows.map(r => Number(r.dailyQuantity || 0))
      const avgDaily = dailyQuantities.length > 0 ? dailyQuantities.reduce((a, b) => a + b, 0) / dailyQuantities.length : 0
      
      // Calculate trend (linear regression slope)
      const n = dailyQuantities.length
      let slope = 0
      if (n > 1) {
        const indices = Array.from({length: n}, (_, i) => i)
        const avgX = indices.reduce((a, b) => a + b, 0) / n
        const avgY = avgDaily
        let numerator = 0, denominator = 0
        for (let i = 0; i < n; i++) {
          numerator += (indices[i] - avgX) * (dailyQuantities[i] - avgY)
          denominator += (indices[i] - avgX) * (indices[i] - avgX)
        }
        slope = denominator !== 0 ? numerator / denominator : 0
      }

      // Forecast next 30 days
      const forecast = []
      for (let i = 1; i <= days; i++) {
        const forecastValue = Math.max(0, avgDaily + slope * i)
        forecast.push({
          day: i,
          forecastQuantity: Math.round(forecastValue * 100) / 100,
          cumulative: Math.round(forecast.reduce((sum, f) => sum + f.forecastQuantity, 0) * 100) / 100
        })
      }

      // Calculate confidence intervals (simple method using standard deviation)
      const stdDev = dailyQuantities.length > 0 
        ? Math.sqrt(dailyQuantities.reduce((sum, q) => sum + Math.pow(q - avgDaily, 2), 0) / dailyQuantities.length)
        : 0

      return NextResponse.json({
        productId,
        forecast,
        stats: {
          avgDailyDemand: Math.round(avgDaily * 100) / 100,
          trendSlope: Math.round(slope * 100) / 100,
          stdDev: Math.round(stdDev * 100) / 100,
          confidenceIntervalUpper: Math.round((avgDaily + 2 * stdDev) * 100) / 100,
          confidenceIntervalLower: Math.round(Math.max(0, avgDaily - 2 * stdDev) * 100) / 100,
          totalForecast30Days: Math.round(forecast.reduce((sum, f) => sum + f.forecastQuantity, 0) * 100) / 100
        }
      })
    }

    // Forecast for all products (summary)
    const allProducts = await pool.query(`
      SELECT DISTINCT p.id, p.name, p.sku
      FROM "Product" p
      WHERE p."organizationId" = $1
      LIMIT 50
    `, [orgId]).catch(() => ({ rows: [] }))

    const productForecasts = []
    for (const product of allProducts.rows) {
      const history = await pool.query(`
        SELECT COALESCE(SUM(sm.quantity), 0) as "totalOut"
        FROM "StockMove" sm
        WHERE sm."productId" = $1 
          AND sm."organizationId" = $2
          AND sm."movementType" = 'OUT'
          AND sm."createdAt" >= NOW() - INTERVAL '30 days'
      `, [product.id, orgId]).catch(() => ({ rows: [{ totalOut: 0 }] }))

      const monthlyDemand = Number(history.rows[0]?.totalOut || 0)
      const dailyAvg = monthlyDemand / 30
      const forecast30 = dailyAvg * 30

      productForecasts.push({
        productId: product.id,
        name: product.name,
        sku: product.sku,
        monthlyDemand: Math.round(monthlyDemand * 100) / 100,
        dailyAvg: Math.round(dailyAvg * 100) / 100,
        forecast30Days: Math.round(forecast30 * 100) / 100,
        trend: dailyAvg > 0 ? 'STABLE' : 'NO_DATA'
      })
    }

    return NextResponse.json({ productForecasts })
  } catch (error) {
    console.error('Forecast error:', error)
    return NextResponse.json({ productForecasts: [], forecast: [], stats: null })
  }
}