export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/wavecore/auth'
import { pool } from '@/lib/wavecore/db'

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const orgId = session.organizationId

    // Get all products with their value and demand variability
    const products = await pool.query(`
      SELECT 
        p.id, p.name, p.sku,
        COALESCE(p."sellingPrice" * COALESCE(sq.quantity, 0), 0) as "stockValue",
        COALESCE(sq.quantity, 0) as "currentStock",
        p."sellingPrice",
        p."costPrice",
        p.category
      FROM "Product" p
      LEFT JOIN "StockQuantity" sq ON sq."productId" = p.id
      WHERE p."organizationId" = $1
      ORDER BY "stockValue" DESC
    `, [orgId]).catch(() => ({ rows: [] }))

    const productList = products.rows
    const totalValue = productList.reduce((sum, p) => sum + Number(p.stockValue || 0), 0)

    // ABC Classification (based on value - Pareto 80/20)
    let cumulativeValue = 0
    const abcClassified = productList.map(p => {
      cumulativeValue += Number(p.stockValue || 0)
      const cumulativePercent = totalValue > 0 ? (cumulativeValue / totalValue) * 100 : 0
      let abcClass = 'C'
      if (cumulativePercent <= 80) abcClass = 'A'
      else if (cumulativePercent <= 95) abcClass = 'B'
      return { ...p, abcClass, cumulativePercent: Math.round(cumulativePercent * 100) / 100 }
    })

    // XYZ Classification (based on demand variability)
    // For simplicity, use current stock as proxy for demand stability
    const xyzClassified = abcClassified.map(p => {
      const stockLevel = Number(p.currentStock || 0)
      const reorderPoint = Number(p.minStock || 10)
      let xyzClass = 'Z'
      if (stockLevel >= reorderPoint * 2) xyzClass = 'X'
      else if (stockLevel >= reorderPoint) xyzClass = 'Y'
      return { ...p, xyzClass }
    })

    // Combined ABC-XYZ classification
    const combined = xyzClassified.map(p => ({
      ...p,
      combinedClass: `${p.abcClass}${p.xyzClass}`,
      recommendedServiceLevel: p.abcClass === 'A' ? 'HIGH' : p.abcClass === 'B' ? 'MEDIUM' : 'LOW',
      recommendedCountingFrequency: p.abcClass === 'A' ? 'WEEKLY' : p.abcClass === 'B' ? 'MONTHLY' : 'QUARTERLY',
      recommendedSafetyStock: p.abcClass === 'A' ? Number(p.currentStock || 0) * 0.5 : p.abcClass === 'B' ? Number(p.currentStock || 0) * 0.3 : Number(p.currentStock || 0) * 0.2
    }))

    const summary = {
      totalProducts: productList.length,
      totalValue: Math.round(totalValue * 100) / 100,
      aClassCount: combined.filter(p => p.abcClass === 'A').length,
      bClassCount: combined.filter(p => p.abcClass === 'B').length,
      cClassCount: combined.filter(p => p.abcClass === 'C').length,
      aClassValue: Math.round(combined.filter(p => p.abcClass === 'A').reduce((sum, p) => sum + Number(p.stockValue || 0), 0) * 100) / 100,
      bClassValue: Math.round(combined.filter(p => p.abcClass === 'B').reduce((sum, p) => sum + Number(p.stockValue || 0), 0) * 100) / 100,
      cClassValue: Math.round(combined.filter(p => p.abcClass === 'C').reduce((sum, p) => sum + Number(p.stockValue || 0), 0) * 100) / 100
    }

    return NextResponse.json({ products: combined, summary })
  } catch (error) {
    console.error('ABC/XYZ error:', error)
    return NextResponse.json({ products: [], summary: { totalProducts: 0, totalValue: 0, aClassCount: 0, bClassCount: 0, cClassCount: 0, aClassValue: 0, bClassValue: 0, cClassValue: 0 } })
  }
}