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

    if (productId) {
      // ATP for specific product
      const result = await pool.query(`
        SELECT 
          p.id,
          p.name,
          p.sku,
          COALESCE(sq.quantity, 0) as "onHand",
          COALESCE(sq."availableQty", 0) as "available",
          COALESCE(sq."reservedQty", 0) as "reserved",
          COALESCE((SELECT SUM(poi.quantity) FROM "PurchaseOrderItem" poi 
            JOIN "PurchaseOrder" po ON poi."purchaseOrderId" = po.id 
            WHERE poi."productId" = p.id AND po.status IN ('PENDING', 'APPROVED', 'IN_TRANSIT')), 0) as "incomingPO",
          COALESCE((SELECT SUM(soi.quantity) FROM "SalesOrderItem" soi 
            JOIN "SalesOrder" so ON soi."salesOrderId" = so.id 
            WHERE soi."productId" = p.id AND so.status IN ('PENDING', 'CONFIRMED')), 0) as "committedSO",
          COALESCE(sq.quantity, 0) + 
            COALESCE((SELECT SUM(poi.quantity) FROM "PurchaseOrderItem" poi 
              JOIN "PurchaseOrder" po ON poi."purchaseOrderId" = po.id 
              WHERE poi."productId" = p.id AND po.status IN ('PENDING', 'APPROVED', 'IN_TRANSIT')), 0) -
            COALESCE(sq."reservedQty", 0) -
            COALESCE((SELECT SUM(soi.quantity) FROM "SalesOrderItem" soi 
              JOIN "SalesOrder" so ON soi."salesOrderId" = so.id 
              WHERE soi."productId" = p.id AND so.status IN ('PENDING', 'CONFIRMED')), 0) as "atpQuantity"
        FROM "Product" p
        LEFT JOIN "StockQuantity" sq ON sq."productId" = p.id
        WHERE p.id = $1 AND p."organizationId" = $2
      `, [productId, orgId]).catch(() => ({ rows: [] }))

      return NextResponse.json({ atp: result.rows[0] || null })
    }

    // ATP for all products
    const result = await pool.query(`
      SELECT 
        p.id,
        p.name,
        p.sku,
        COALESCE(sq.quantity, 0) as "onHand",
        COALESCE(sq."availableQty", 0) as "available",
        COALESCE(sq."reservedQty", 0) as "reserved",
        COALESCE(sq.quantity, 0) - COALESCE(sq."reservedQty", 0) as "atpQuantity"
      FROM "Product" p
      LEFT JOIN "StockQuantity" sq ON sq."productId" = p.id
      WHERE p."organizationId" = $1
      ORDER BY "atpQuantity" ASC
    `, [orgId]).catch(() => ({ rows: [] }))

    return NextResponse.json({ atpList: result.rows })
  } catch (error) {
    console.error('ATP error:', error)
    return NextResponse.json({ atp: null, atpList: [] })
  }
}