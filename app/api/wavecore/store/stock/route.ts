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
        p."costPrice",
        COALESCE(SUM(sq.quantity), 0) AS stock_level,
        p.category,
        COALESCE(p."minStock", 10) AS "reorderLevel",
        p."createdAt",
        CASE 
          WHEN COALESCE(SUM(sq.quantity), 0) = 0 THEN 'OUT_OF_STOCK'
          WHEN COALESCE(SUM(sq.quantity), 0) < COALESCE(p."minStock", 10) THEN 'LOW_STOCK'
          ELSE 'IN_STOCK'
        END as "stockStatus"
      FROM "Product" p
      LEFT JOIN "StockQuantity" sq ON sq."productId" = p.id
      WHERE p."organizationId" = $1
      GROUP BY p.id
      ORDER BY COALESCE(SUM(sq.quantity), 0) ASC
    `, [session.organizationId])

    const products = result.rows
    const totalProducts = products.length
    const totalStockUnits = products.reduce((sum, p) => sum + Number(p.stock_level || 0), 0)
    const outOfStock = products.filter(p => Number(p.stock_level || 0) === 0).length
    const lowStock = products.filter(p => Number(p.stock_level || 0) > 0 && Number(p.stock_level || 0) < Number(p.reorderLevel || 10)).length
    const inStock = products.filter(p => Number(p.stock_level || 0) >= Number(p.reorderLevel || 10)).length

    return NextResponse.json({ 
      products,
      stats: {
        totalProducts,
        totalStockUnits,
        outOfStock,
        lowStock,
        inStock
      }
    })
  } catch (error) {
    console.error('Stock GET error:', error)
    return NextResponse.json({ 
      products: [], 
      stats: { totalProducts: 0, totalStockUnits: 0, outOfStock: 0, lowStock: 0, inStock: 0 }
    })
  }
}
