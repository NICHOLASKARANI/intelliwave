export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/wavecore/auth'
import { pool } from '@/lib/wavecore/db'

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const result = await pool.query(`
      SELECT
        p.id,
        p.name,
        p.sku,
        p."sellingPrice",
        p.category,
        COALESCE(SUM(sq.quantity), 0) AS stock_level,
        (p."sellingPrice" * COALESCE(SUM(sq.quantity), 0)) AS "stockValue",
        p."createdAt"
      FROM "Product" p
      LEFT JOIN "StockQuantity" sq ON sq."productId" = p.id
      WHERE p."organizationId" = $1
      GROUP BY p.id
      ORDER BY (p."sellingPrice" * COALESCE(SUM(sq.quantity), 0)) DESC
    `, [session.organizationId])

    const products = result.rows
    const totalStockValue = products.reduce((sum, p) => sum + Number(p.stockValue || 0), 0)
    const totalProducts = products.length
    const highValueProducts = products.filter(p => Number(p.stockValue || 0) > 100000).length
    const lowValueProducts = products.filter(p => Number(p.stockValue || 0) < 1000).length

    return NextResponse.json({ 
      products,
      stats: {
        totalStockValue,
        totalProducts,
        highValueProducts,
        lowValueProducts
      }
    })
  } catch (error) {
    console.error('Stock Value GET error:', error)
    return NextResponse.json({ products: [], stats: { totalStockValue: 0, totalProducts: 0, highValueProducts: 0, lowValueProducts: 0 } })
  }
}
