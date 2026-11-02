export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/wavecore/auth'
import { pool } from '@/lib/wavecore/db'
import { rowsToCsv, csvResponse, todayStamp } from '@/lib/wavve-si/csv'

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const result = await pool.query(
      `SELECT p.name, p.sku, p.category, p.unit, p."sellingPrice", p."costPrice", p."isActive",
              COALESCE(SUM(sq.quantity), 0) AS stock_level
       FROM "Product" p
       LEFT JOIN "StockQuantity" sq ON sq."productId" = p.id
       WHERE p."organizationId" = $1
       GROUP BY p.id
       ORDER BY p.name ASC`,
      [session.organizationId]
    )

    const headers = ['Name', 'SKU', 'Category', 'Unit', 'Selling Price (KSh)', 'Cost Price (KSh)', 'Stock', 'Status']
    const rows = result.rows.map(r => [
      r.name,
      r.sku,
      r.category || '',
      r.unit || '',
      Number(r.sellingPrice).toFixed(2),
      Number(r.costPrice).toFixed(2),
      Number(r.stock_level),
      r.isActive ? 'ACTIVE' : 'INACTIVE',
    ])

    const csv = rowsToCsv(headers, rows)
    return csvResponse(csv, `menu-${todayStamp()}.csv`) as any
  } catch (err: any) {
    console.error('[menu/export] error:', err?.message)
    return NextResponse.json({ error: 'Failed to export menu' }, { status: 500 })
  }
}