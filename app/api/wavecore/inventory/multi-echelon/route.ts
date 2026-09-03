export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/wavecore/auth'
import { pool } from '@/lib/wavecore/db'

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const orgId = session.organizationId

    // Get all warehouses with their stock levels
    const warehouses = await pool.query(`
      SELECT 
        w.id, w.name, w.code,
        (SELECT COALESCE(SUM(sq.quantity), 0) FROM "StockQuantity" sq 
         JOIN "StockLocation" sl ON sq."locationId" = sl.id WHERE sl."warehouseId" = w.id) as "totalStock",
        (SELECT COALESCE(SUM(p."sellingPrice" * COALESCE(sq.quantity, 0)), 0) 
         FROM "StockQuantity" sq 
         JOIN "StockLocation" sl ON sq."locationId" = sl.id 
         JOIN "Product" p ON sq."productId" = p.id
         WHERE sl."warehouseId" = w.id) as "stockValue"
      FROM "Warehouse" w
      WHERE w."organizationId" = $1 AND w."isActive" = true
      ORDER BY "totalStock" DESC
    `, [orgId]).catch(() => ({ rows: [] }))

    // Get products that are unbalanced across warehouses
    const unbalancedProducts = await pool.query(`
      WITH warehouse_stock AS (
        SELECT 
          sq."productId",
          sl."warehouseId",
          w.name as "warehouseName",
          COALESCE(sq.quantity, 0) as quantity
        FROM "StockQuantity" sq
        JOIN "StockLocation" sl ON sq."locationId" = sl.id
        JOIN "Warehouse" w ON sl."warehouseId" = w.id
        WHERE w."organizationId" = $1
      )
      SELECT 
        p.id, p.name, p.sku,
        ws."warehouseName",
        ws.quantity,
        p."minStock", p."maxStock"
      FROM "Product" p
      JOIN warehouse_stock ws ON p.id = ws."productId"
      WHERE p."organizationId" = $1
        AND (ws.quantity > p."maxStock" * 1.5 OR ws.quantity < p."minStock")
      ORDER BY p.name ASC
      LIMIT 50
    `, [orgId]).catch(() => ({ rows: [] }))

    // Generate transfer recommendations
    const transferRecommendations = []
    const productMap = new Map()
    
    for (const row of unbalancedProducts.rows) {
      if (!productMap.has(row.id)) {
        productMap.set(row.id, [])
      }
      productMap.get(row.id).push(row)
    }

    for (const [productId, locations] of productMap) {
      const overstocked = locations.filter((l: any) => Number(l.quantity) > Number(l.maxStock) * 1.5)
      const understocked = locations.filter((l: any) => Number(l.quantity) < Number(l.minStock))
      
      if (overstocked.length > 0 && understocked.length > 0) {
        for (const from of overstocked) {
          for (const to of understocked) {
            const transferQty = Math.min(
              Number(from.quantity) - Number(from.maxStock),
              Number(to.minStock) - Number(to.quantity)
            )
            if (transferQty > 0) {
              transferRecommendations.push({
                productId,
                productName: from.name,
                sku: from.sku,
                fromWarehouse: from.warehouseName,
                toWarehouse: to.warehouseName,
                transferQuantity: Math.ceil(transferQty),
                reason: 'BALANCING'
              })
            }
          }
        }
      }
    }

    return NextResponse.json({
      warehouses: warehouses.rows,
      unbalancedProducts: unbalancedProducts.rows,
      transferRecommendations,
      summary: {
        totalWarehouses: warehouses.rows.length,
        totalTransferRecommendations: transferRecommendations.length,
        totalTransferQuantity: transferRecommendations.reduce((sum, r) => sum + r.transferQuantity, 0)
      }
    })
  } catch (error) {
    console.error('Multi-Echelon error:', error)
    return NextResponse.json({ warehouses: [], unbalancedProducts: [], transferRecommendations: [], summary: { totalWarehouses: 0, totalTransferRecommendations: 0, totalTransferQuantity: 0 } })
  }
}