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
      const product = await pool.query(`
        SELECT p.*, COALESCE(sq.quantity, 0) as "onHand",
          COALESCE(sq."availableQty", COALESCE(sq.quantity, 0)) as "available",
          COALESCE(sq."reservedQty", 0) as "reserved"
        FROM "Product" p
        LEFT JOIN "StockQuantity" sq ON sq."productId" = p.id
        WHERE p.id = $1 AND p."organizationId" = $2
      `, [productId, orgId])

      if (product.rows.length === 0) {
        return NextResponse.json({ error: 'Product not found' }, { status: 404 })
      }

      const p = product.rows[0]
      const onHand = Number(p.onHand || 0)
      const available = Number(p.available || 0)
      const reserved = Number(p.reserved || 0)

      // Incoming supply (pending POs)
      const incomingPO = await pool.query(`
        SELECT COALESCE(SUM(amount / NULLIF(quantity, 0)), 0) as "incomingValue"
        FROM "PurchaseOrder" WHERE "organizationId" = $1 AND status = 'PENDING'
      `, [orgId]).catch(() => ({ rows: [{ incomingValue: 0 }] }))

      // Calculate ATP
      const atp = available - reserved

      return NextResponse.json({
        atp: {
          productId: p.id,
          name: p.name,
          sku: p.sku,
          onHand,
          available,
          reserved,
          incomingSupply: Number(incomingPO.rows[0]?.incomingValue || 0),
          atpQuantity: atp,
          canPromise: atp > 0,
          maxPromiseQuantity: Math.max(0, atp)
        }
      })
    }

    // ATP for all products
    const allProducts = await pool.query(`
      SELECT p.id, p.name, p.sku,
        COALESCE(sq.quantity, 0) as "onHand",
        COALESCE(sq."availableQty", COALESCE(sq.quantity, 0)) as "available",
        COALESCE(sq."reservedQty", 0) as "reserved",
        COALESCE(sq."availableQty", COALESCE(sq.quantity, 0)) - COALESCE(sq."reservedQty", 0) as "atpQuantity"
      FROM "Product" p
      LEFT JOIN "StockQuantity" sq ON sq."productId" = p.id
      WHERE p."organizationId" = $1
      ORDER BY "atpQuantity" ASC
    `, [orgId]).catch(() => ({ rows: [] }))

    const atpList = allProducts.rows.map(p => ({
      ...p,
      canPromise: Number(p.atpQuantity || 0) > 0
    }))

    const summary = {
      totalProducts: atpList.length,
      canPromise: atpList.filter(p => p.canPromise).length,
      cannotPromise: atpList.filter(p => !p.canPromise).length,
      totalAvailable: atpList.reduce((s, p) => s + Number(p.available || 0), 0),
      totalReserved: atpList.reduce((s, p) => s + Number(p.reserved || 0), 0),
      totalATP: atpList.reduce((s, p) => s + Number(p.atpQuantity || 0), 0)
    }

    return NextResponse.json({ atpList, summary })
  } catch (error) {
    console.error('ATP error:', error)
    return NextResponse.json({ atpList: [], summary: { totalProducts: 0, canPromise: 0, cannotPromise: 0, totalAvailable: 0, totalReserved: 0, totalATP: 0 } })
  }
}