export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/wavecore/auth'
import { pool } from '@/lib/wavecore/db'

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const orgId = session.organizationId

    // Get all products with stock value
    const products = await pool.query(`
      SELECT 
        p.id, p.name, p.sku, p."sellingPrice", p."costPrice",
        COALESCE(sq.quantity, 0) as "currentStock",
        p."minStock", p."maxStock",
        p."sellingPrice" * COALESCE(sq.quantity, 0) as "stockValue"
      FROM "Product" p
      LEFT JOIN "StockQuantity" sq ON sq."productId" = p.id
      WHERE p."organizationId" = $1
      ORDER BY "stockValue" DESC
    `, [orgId]).catch(() => ({ rows: [] }))

    const productList = products.rows
    const totalValue = productList.reduce((sum, p) => sum + Number(p.stockValue || 0), 0)

    // ABC Classification (Pareto - 80/20 rule)
    let cumulativeValue = 0
    const abcClassified = productList.map(p => {
      cumulativeValue += Number(p.stockValue || 0)
      const cumulativePercent = totalValue > 0 ? (cumulativeValue / totalValue) * 100 : 0
      let abcClass = 'C'
      if (cumulativePercent <= 80) abcClass = 'A'
      else if (cumulativePercent <= 95) abcClass = 'B'
      return { ...p, abcClass, cumulativePercent: Math.round(cumulativePercent * 100) / 100 }
    })

    // XYZ Classification (demand variability)
    const xyzClassified = []
    for (const product of abcClassified) {
      const movements = await pool.query(`
        SELECT COALESCE(STDDEV(quantity), 0) as "stdDev", COALESCE(AVG(quantity), 0) as "avgDemand"
        FROM "StockMove"
        WHERE "productId" = $1 AND "organizationId" = $2 AND type = 'DELIVERY'
          AND "createdAt" >= NOW() - INTERVAL '90 days'
      `, [product.id, orgId]).catch(() => ({ rows: [{ stdDev: 0, avgDemand: 0 }] }))

      const avgDemand = Number(movements.rows[0]?.avgDemand || 0)
      const stdDev = Number(movements.rows[0]?.stdDev || 0)
      const coefficientOfVariation = avgDemand > 0 ? (stdDev / avgDemand) : 0

      let xyzClass = 'Z'
      if (coefficientOfVariation < 0.5) xyzClass = 'X'
      else if (coefficientOfVariation < 1.0) xyzClass = 'Y'

      const combinedClass = product.abcClass + xyzClass

      xyzClassified.push({
        ...product,
        xyzClass,
        combinedClass,
        avgDemand: Math.round(avgDemand * 100) / 100,
        stdDev: Math.round(stdDev * 100) / 100,
        coefficientOfVariation: Math.round(coefficientOfVariation * 100) / 100,
        recommendedServiceLevel: product.abcClass === 'A' ? 'HIGH (98%)' : product.abcClass === 'B' ? 'MEDIUM (95%)' : 'LOW (90%)',
        recommendedCountingFrequency: product.abcClass === 'A' ? 'WEEKLY' : product.abcClass === 'B' ? 'MONTHLY' : 'QUARTERLY',
        recommendedSafetyStock: Math.round(Number(product.currentStock || 0) * (product.abcClass === 'A' ? 0.5 : product.abcClass === 'B' ? 0.3 : 0.2))
      })
    }

    // Summary
    const summary = {
      totalProducts: xyzClassified.length,
      totalValue: Math.round(totalValue * 100) / 100,
      aClass: xyzClassified.filter(p => p.abcClass === 'A').length,
      bClass: xyzClassified.filter(p => p.abcClass === 'B').length,
      cClass: xyzClassified.filter(p => p.abcClass === 'C').length,
      xClass: xyzClassified.filter(p => p.xyzClass === 'X').length,
      yClass: xyzClassified.filter(p => p.xyzClass === 'Y').length,
      zClass: xyzClassified.filter(p => p.xyzClass === 'Z').length,
      aClassValue: Math.round(xyzClassified.filter(p => p.abcClass === 'A').reduce((s, p) => s + Number(p.stockValue || 0), 0)),
      bClassValue: Math.round(xyzClassified.filter(p => p.abcClass === 'B').reduce((s, p) => s + Number(p.stockValue || 0), 0)),
      cClassValue: Math.round(xyzClassified.filter(p => p.abcClass === 'C').reduce((s, p) => s + Number(p.stockValue || 0), 0))
    }

    return NextResponse.json({ products: xyzClassified, summary })
  } catch (error) {
    console.error('ABC/XYZ error:', error)
    return NextResponse.json({ products: [], summary: { totalProducts: 0, totalValue: 0, aClass: 0, bClass: 0, cClass: 0, xClass: 0, yClass: 0, zClass: 0, aClassValue: 0, bClassValue: 0, cClassValue: 0 } })
  }
}