export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const statusFilter = searchParams.get('status')

    // 1. Get all products for the org
    let prodSql = `SELECT id, name, sku, unit, "costPrice", "minStock", "maxStock", "isActive"
                   FROM "Product" WHERE "organizationId" = $1`
    const params: any[] = [session.organizationId]
    if (search) {
      prodSql += ` AND (name ILIKE $2 OR sku ILIKE $2)`
      params.push(`%${search}%`)
    }
    prodSql += ` ORDER BY name ASC LIMIT 500`

    const prodRes = await pool.query(prodSql, params)
    const products = prodRes.rows

    if (products.length === 0) {
      return NextResponse.json({
        items: [],
        summary: { total: 0, shortage: 0, low: 0, ok: 0, surplus: 0, critical: 0, totalValueAtRisk: 0, suggestions: 0 }
      })
    }

    const productIds = products.map(p => p.id)
    const productNames = products.map(p => p.name)

    // 2. Get on-hand stock per product
    const stockRes = await pool.query(
      `SELECT "productId", COALESCE(SUM(quantity), 0) AS "onHand"
       FROM "StockQuantity"
       WHERE "productId" = ANY($1::text[])
       GROUP BY "productId"`,
      [productIds]
    ).catch(() => ({ rows: [] }))
    const stockMap: Record<string, number> = {}
    for (const row of stockRes.rows) stockMap[row.productId] = Number(row.onHand || 0)

    // 3. Get allocated qty from open work orders (by product name or productId)
    const woRes = await pool.query(
      `SELECT "productId", COALESCE(SUM(quantity - COALESCE("completedQty", 0)), 0) AS allocated
       FROM "WorkOrder"
       WHERE "organizationId" = $1
         AND status NOT IN ('COMPLETED', 'CANCELLED')
         AND ("productId" = ANY($2::text[]) OR "productId" = ANY($3::text[]))
       GROUP BY "productId"`,
      [session.organizationId, productIds, productNames]
    ).catch(() => ({ rows: [] }))
    const allocatedMap: Record<string, number> = {}
    for (const row of woRes.rows) allocatedMap[row.productId] = Number(row.allocated || 0)

    // 4. Compute MRP analysis
    const items = products.map(p => {
      const onHand = stockMap[p.id] ?? stockMap[p.name] ?? 0
      const allocated = allocatedMap[p.id] ?? allocatedMap[p.name] ?? 0
      const minStock = Number(p.minStock || 0)
      const maxStock = Number(p.maxStock || 0)
      const available = onHand - allocated
      const reorderPoint = minStock
      const safetyStock = Math.max(0, Math.round(minStock * 0.2))

      let status = 'OK'
      let suggestedQty = 0

      if (available < 0) {
        status = 'SHORTAGE'
        suggestedQty = Math.abs(available) + safetyStock
      } else if (available < reorderPoint) {
        status = 'LOW'
        suggestedQty = reorderPoint + safetyStock - available
      } else if (maxStock > 0 && available > maxStock) {
        status = 'SURPLUS'
        suggestedQty = 0
      }

      const unitCost = Number(p.costPrice || 0)
      const valueAtRisk = suggestedQty * unitCost

      return {
        id: p.id,
        name: p.name,
        sku: p.sku,
        unit: p.unit || 'pcs',
        onHand,
        allocated,
        available,
        reorderPoint,
        safetyStock,
        maxStock,
        suggestedQty,
        unitCost,
        valueAtRisk,
        status,
      }
    })

    let filtered = items
    if (statusFilter && statusFilter !== 'ALL') {
      filtered = items.filter(i => i.status === statusFilter)
    }

    const summary = {
      total: items.length,
      shortage: items.filter(i => i.status === 'SHORTAGE').length,
      low: items.filter(i => i.status === 'LOW').length,
      ok: items.filter(i => i.status === 'OK').length,
      surplus: items.filter(i => i.status === 'SURPLUS').length,
      critical: items.filter(i => i.status === 'SHORTAGE' && i.available < 0).length,
      suggestions: items.filter(i => i.suggestedQty > 0).length,
      totalValueAtRisk: Math.round(items.reduce((s, i) => s + i.valueAtRisk, 0)),
      totalSuggestedValue: Math.round(items.reduce((s, i) => s + i.valueAtRisk, 0)),
    }

    return NextResponse.json({ items: filtered, summary, allItems: items })
  } catch (error) {
    console.error('MRP GET error:', error)
    return NextResponse.json({ items: [], summary: {}, error: (error as Error).message })
  }
}