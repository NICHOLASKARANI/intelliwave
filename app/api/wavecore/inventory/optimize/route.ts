export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/wavecore/auth'
import { pool } from '@/lib/wavecore/db'

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const orgId = session.organizationId

    // Get all products with stock and demand data
    const products = await pool.query(`
      SELECT 
        p.id, p.name, p.sku,
        COALESCE(sq.quantity, 0) as "currentStock",
        p."minStock", p."maxStock",
        p."sellingPrice", p."costPrice",
        p.category,
        p."createdAt"
      FROM "Product" p
      LEFT JOIN "StockQuantity" sq ON sq."productId" = p.id
      WHERE p."organizationId" = $1
    `, [orgId]).catch(() => ({ rows: [] }))

    const recommendations = []
    for (const product of products.rows) {
      const currentStock = Number(product.currentStock || 0)
      const minStock = Number(product.minStock || 10)
      const maxStock = Number(product.maxStock || 100)
      const costPrice = Number(product.costPrice || 0)

      let type = 'OPTIMAL'
      let action = 'NO_ACTION'
      let suggestedQuantity = 0
      let priority = 'LOW'

      if (currentStock === 0) {
        type = 'CRITICAL'
        action = 'REORDER_NOW'
        suggestedQuantity = maxStock
        priority = 'CRITICAL'
      } else if (currentStock < minStock) {
        type = 'LOW_STOCK'
        action = 'REORDER'
        suggestedQuantity = maxStock - currentStock
        priority = 'HIGH'
      } else if (currentStock > maxStock * 1.5) {
        type = 'OVERSTOCKED'
        action = 'REDUCE_STOCK'
        suggestedQuantity = currentStock - maxStock
        priority = 'MEDIUM'
      } else if (currentStock > maxStock) {
        type = 'ABOVE_MAX'
        action = 'MONITOR'
        suggestedQuantity = currentStock - maxStock
        priority = 'LOW'
      }

      if (action !== 'NO_ACTION') {
        recommendations.push({
          productId: product.id,
          name: product.name,
          sku: product.sku,
          category: product.category,
          currentStock,
          minStock,
          maxStock,
          type,
          action,
          priority,
          suggestedQuantity,
          estimatedValue: Math.round(suggestedQuantity * costPrice * 100) / 100,
          createdAt: product.createdAt
        })
      }
    }

    // Sort by priority
    const priorityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 }
    recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])

    return NextResponse.json({
      recommendations,
      summary: {
        totalRecommendations: recommendations.length,
        critical: recommendations.filter(r => r.priority === 'CRITICAL').length,
        high: recommendations.filter(r => r.priority === 'HIGH').length,
        medium: recommendations.filter(r => r.priority === 'MEDIUM').length,
        low: recommendations.filter(r => r.priority === 'LOW').length,
        totalReorderValue: Math.round(recommendations.filter(r => r.action === 'REORDER_NOW' || r.action === 'REORDER').reduce((sum, r) => sum + r.estimatedValue, 0) * 100) / 100
      }
    })
  } catch (error) {
    console.error('Optimize error:', error)
    return NextResponse.json({ recommendations: [], summary: { totalRecommendations: 0, critical: 0, high: 0, medium: 0, low: 0, totalReorderValue: 0 } })
  }
}