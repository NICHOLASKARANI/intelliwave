export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/wavecore/auth'
import { pool } from '@/lib/wavecore/db'

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const orgId = session.organizationId

    const products = await pool.query(`
      SELECT 
        p.id, p.name, p.sku, p."sellingPrice", p."costPrice",
        COALESCE(sq.quantity, 0) as "currentStock",
        p."minStock", p."maxStock",
        CASE 
          WHEN COALESCE(sq.quantity, 0) = 0 THEN 'CRITICAL'
          WHEN COALESCE(sq.quantity, 0) < p."minStock" THEN 'LOW'
          ELSE 'OK'
        END as priority,
        CASE 
          WHEN COALESCE(sq.quantity, 0) = 0 THEN p."maxStock"
          ELSE p."maxStock" - COALESCE(sq.quantity, 0)
        END as "suggestedOrderQty",
        CASE 
          WHEN COALESCE(sq.quantity, 0) = 0 THEN p."maxStock" * p."costPrice"
          ELSE (p."maxStock" - COALESCE(sq.quantity, 0)) * p."costPrice"
        END as "suggestedOrderValue"
      FROM "Product" p
      LEFT JOIN "StockQuantity" sq ON sq."productId" = p.id
      WHERE p."organizationId" = $1
        AND COALESCE(sq.quantity, 0) < COALESCE(p."minStock", 10)
      ORDER BY 
        CASE WHEN COALESCE(sq.quantity, 0) = 0 THEN 0 ELSE 1 END,
        COALESCE(sq.quantity, 0) ASC
    `, [orgId]).catch(() => ({ rows: [] }))

    const reorderList = products.rows
    const totalReorderValue = reorderList.reduce((sum, r) => sum + Number(r.suggestedOrderValue || 0), 0)
    const criticalCount = reorderList.filter(r => r.priority === 'CRITICAL').length
    const lowCount = reorderList.filter(r => r.priority === 'LOW').length
    const totalQuantity = reorderList.reduce((sum, r) => sum + Number(r.suggestedOrderQty || 0), 0)

    return NextResponse.json({
      reorderList,
      summary: { totalReorderValue, criticalCount, lowCount, totalQuantity, totalItems: reorderList.length }
    })
  } catch (error) {
    console.error('Reorder error:', error)
    return NextResponse.json({ reorderList: [], summary: { totalReorderValue: 0, criticalCount: 0, lowCount: 0, totalQuantity: 0, totalItems: 0 } })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const crypto = require('crypto')
    const id = crypto.randomUUID()
    const number = 'PO-' + Date.now().toString().slice(-8)

    // Get product details
    const productResult = await pool.query(
      'SELECT name FROM "Product" WHERE id = $1 AND "organizationId" = $2',
      [body.productId, session.organizationId]
    )

    if (productResult.rows.length === 0) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    const notes = JSON.stringify({
      buyingPrice: Number(body.buyingPrice || 0),
      sellingPrice: Number(body.sellingPrice || 0),
      supplier: body.supplier || ''
    })

    // Create Purchase Order record
    await pool.query(`
      INSERT INTO "PurchaseOrder" (id, number, "productId", quantity, status, notes, "organizationId", "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, 'PENDING', $5, $6, NOW(), NOW())
    `, [id, number, body.productId, Number(body.quantity || 0), notes, session.organizationId]).catch(() => {})

    // Write to Ledger
    const ledgerId = crypto.randomUUID()
    await pool.query(
      'INSERT INTO "InventoryLedger" (id, "transactionId", "productId", "productName", quantity, "beforeQuantity", "afterQuantity", "transactionType", "organizationId", "createdAt") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())',
      [ledgerId, id, body.productId, productResult.rows[0].name, Number(body.quantity || 0), 0, Number(body.quantity || 0), 'PURCHASE_ORDER', session.organizationId]
    ).catch(() => {})

    return NextResponse.json({ 
      success: true, 
      purchaseOrder: { id, number, productId: body.productId, quantity: body.quantity, status: 'PENDING' },
      message: 'Purchase order created for reorder' 
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

    await pool.query('DELETE FROM "PurchaseOrder" WHERE id = $1 AND "organizationId" = $2', [id, session.organizationId]).catch(() => {})
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
  }
}