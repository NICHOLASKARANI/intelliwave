export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/wavecore/auth'
import { pool } from '@/lib/wavecore/db'

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const orgId = session.organizationId

    // Products that need reordering
    const reorderList = await pool.query(`
      SELECT 
        p.id,
        p.name,
        p.sku,
        COALESCE(sq.quantity, 0) as "currentStock",
        p."minStock" as "reorderPoint",
        p."maxStock" as "targetStock",
        p."sellingPrice",
        p."costPrice",
        CASE 
          WHEN COALESCE(sq.quantity, 0) = 0 THEN p."maxStock"
          ELSE p."maxStock" - COALESCE(sq.quantity, 0)
        END as "suggestedOrderQty",
        CASE 
          WHEN COALESCE(sq.quantity, 0) = 0 THEN p."maxStock" * p."costPrice"
          ELSE (p."maxStock" - COALESCE(sq.quantity, 0)) * p."costPrice"
        END as "suggestedOrderValue",
        CASE 
          WHEN COALESCE(sq.quantity, 0) = 0 THEN 'CRITICAL'
          WHEN COALESCE(sq.quantity, 0) < p."minStock" THEN 'LOW'
          ELSE 'OK'
        END as "priority"
      FROM "Product" p
      LEFT JOIN "StockQuantity" sq ON sq."productId" = p.id
      WHERE p."organizationId" = $1
        AND COALESCE(sq.quantity, 0) < COALESCE(p."minStock", 10)
      ORDER BY 
        CASE 
          WHEN COALESCE(sq.quantity, 0) = 0 THEN 0
          ELSE COALESCE(sq.quantity, 0)
        END ASC
    `, [orgId]).catch(() => ({ rows: [] }))

    const totalReorderValue = reorderList.rows.reduce((sum, r) => sum + Number(r.suggestedOrderValue || 0), 0)

    return NextResponse.json({
      reorderList: reorderList.rows,
      totalReorderValue,
      totalItems: reorderList.rows.length
    })
  } catch (error) {
    console.error('Reorder error:', error)
    return NextResponse.json({ reorderList: [], totalReorderValue: 0, totalItems: 0 })
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

    // Create purchase order for reorder
    await pool.query(`
      INSERT INTO "PurchaseOrder" (id, number, "productId", quantity, status, "organizationId", "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, 'PENDING', $5, NOW(), NOW())
    `, [id, number, body.productId, body.quantity, session.organizationId]).catch(() => {})

    return NextResponse.json({ 
      purchaseOrder: { id, number, productId: body.productId, quantity: body.quantity, status: 'PENDING' },
      message: 'Purchase order created for reorder'
    }, { status: 201 })
  } catch (error) {
    console.error('Reorder POST error:', error)
    return NextResponse.json({ error: 'Failed to create reorder' }, { status: 500 })
  }
}