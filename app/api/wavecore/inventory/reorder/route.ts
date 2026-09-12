export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/wavecore/auth'
import { pool } from '@/lib/wavecore/db'

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const orgId = session.organizationId

    // Get products that need reorder AND don't have a pending PO
    const products = await pool.query(`
      SELECT 
        p.id, p.name, p.sku, p."sellingPrice", p."costPrice",
        COALESCE(sq.quantity, 0) as "currentStock",
        p."minStock", p."maxStock",
        CASE WHEN COALESCE(sq.quantity, 0) = 0 THEN 'CRITICAL' WHEN COALESCE(sq.quantity, 0) < p."minStock" THEN 'LOW' ELSE 'OK' END as priority,
        CASE WHEN COALESCE(sq.quantity, 0) = 0 THEN p."maxStock" ELSE p."maxStock" - COALESCE(sq.quantity, 0) END as "suggestedOrderQty",
        CASE WHEN COALESCE(sq.quantity, 0) = 0 THEN p."maxStock" * p."costPrice" ELSE (p."maxStock" - COALESCE(sq.quantity, 0)) * p."costPrice" END as "suggestedOrderValue",
        CASE WHEN EXISTS (SELECT 1 FROM "PurchaseOrder" po WHERE po."organizationId" = $1 AND po.status = 'PENDING' AND po.id = p.id) THEN true ELSE false END as "hasPendingPO"
      FROM "Product" p
      LEFT JOIN "StockQuantity" sq ON sq."productId" = p.id
      WHERE p."organizationId" = $1 AND COALESCE(sq.quantity, 0) < COALESCE(p."minStock", 10)
      ORDER BY CASE WHEN COALESCE(sq.quantity, 0) = 0 THEN 0 ELSE 1 END, COALESCE(sq.quantity, 0) ASC
    `, [orgId]).catch(() => ({ rows: [] }))

    const reorderList = products.rows

    const totalReorderValue = reorderList.reduce((sum, r) => sum + Number(r.suggestedOrderValue || 0), 0)

    // Get existing POs
    const purchaseOrders = await pool.query(`
      SELECT * FROM "PurchaseOrder" WHERE "organizationId" = $1 ORDER BY "createdAt" DESC LIMIT 50
    `, [orgId]).catch(() => ({ rows: [] }))

    return NextResponse.json({
      purchaseOrders: purchaseOrders.rows,
      reorderList,
      purchaseOrders: purchaseOrders.rows,
      summary: {
        totalReorderValue,
        criticalCount: reorderList.filter(r => r.priority === 'CRITICAL').length,
        lowCount: reorderList.filter(r => r.priority === 'LOW').length,
        totalQuantity: reorderList.reduce((sum, r) => sum + Number(r.suggestedOrderQty || 0), 0),
        totalItems: reorderList.length,
        totalPOs: purchaseOrders.rows.length
      }
    })
  } catch (error) {
    return NextResponse.json({ reorderList: [], purchaseOrders: [], summary: { totalReorderValue: 0, criticalCount: 0, lowCount: 0, totalQuantity: 0, totalItems: 0, totalPOs: 0 } })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const crypto = require('crypto')
    const id = crypto.randomUUID()

    const productResult = await pool.query(
      'SELECT name, "costPrice" FROM "Product" WHERE id = $1 AND "organizationId" = $2',
      [body.productId, session.organizationId]
    )

    if (productResult.rows.length === 0) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Check if there's already a PENDING PO for this product
    const existingPO = await pool.query(
      'SELECT id FROM "PurchaseOrder" WHERE "organizationId" = $1 AND status = $2 AND "productId" = $3 LIMIT 1',
      [session.organizationId, 'PENDING', body.productId]
    ).catch(() => ({ rows: [] }))

    if (existingPO.rows.length > 0) {
      return NextResponse.json({ error: 'A pending purchase order already exists for this product' }, { status: 400 })
    }

    const product = productResult.rows[0]
    const quantity = Number(body.quantity || 0)
    const amount = quantity * Number(product.costPrice || 0)

    // Insert with supplierName and amount columns
    const result = await pool.query(`
      INSERT INTO "PurchaseOrder" (id, "supplierName", amount, status, "organizationId", "createdAt")
      VALUES ($1, $2, $3, 'PENDING', $4, NOW()) RETURNING *
    `, [id, body.supplier || 'Default Supplier', amount, session.organizationId])

    return NextResponse.json({ 
      success: true, 
      purchaseOrder: result.rows[0],
      message: 'Purchase order created' 
    }, { status: 201 })
  } catch (error) {
    console.error('Reorder POST error:', error)
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

    await pool.query('DELETE FROM "PurchaseOrder" WHERE id = $1 AND "organizationId" = $2', [id, session.organizationId])
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
  }
}