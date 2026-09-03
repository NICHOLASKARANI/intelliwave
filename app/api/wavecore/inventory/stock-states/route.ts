export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/wavecore/auth'
import { pool } from '@/lib/wavecore/db'

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const orgId = session.organizationId

    // Get stock by state
    const stockStates = await pool.query(`
      SELECT 
        COALESCE(ss.state, 'AVAILABLE') as state,
        COALESCE(SUM(ss.quantity), 0) as "totalQuantity",
        COUNT(DISTINCT ss."productId") as "productCount"
      FROM "StockState" ss
      JOIN "Product" p ON ss."productId" = p.id
      WHERE p."organizationId" = $1
      GROUP BY ss.state
      ORDER BY ss.state
    `, [orgId]).catch(() => ({ rows: [] }))

    // Get all products with their states
    const productStates = await pool.query(`
      SELECT 
        p.id,
        p.name,
        p.sku,
        COALESCE(ss.state, 'AVAILABLE') as state,
        COALESCE(ss.quantity, 0) as quantity,
        p."sellingPrice",
        p."costPrice"
      FROM "Product" p
      LEFT JOIN "StockState" ss ON ss."productId" = p.id
      WHERE p."organizationId" = $1
      ORDER BY p.name ASC
    `, [orgId]).catch(() => ({ rows: [] }))

    const summary = {
      total: productStates.rows.reduce((sum, p) => sum + Number(p.quantity || 0), 0),
      available: productStates.rows.filter(p => p.state === 'AVAILABLE').reduce((sum, p) => sum + Number(p.quantity || 0), 0),
      reserved: productStates.rows.filter(p => p.state === 'RESERVED').reduce((sum, p) => sum + Number(p.quantity || 0), 0),
      allocated: productStates.rows.filter(p => p.state === 'ALLOCATED').reduce((sum, p) => sum + Number(p.quantity || 0), 0),
      quarantine: productStates.rows.filter(p => p.state === 'QUARANTINE').reduce((sum, p) => sum + Number(p.quantity || 0), 0),
      damaged: productStates.rows.filter(p => p.state === 'DAMAGED').reduce((sum, p) => sum + Number(p.quantity || 0), 0),
      inTransit: productStates.rows.filter(p => p.state === 'IN_TRANSIT').reduce((sum, p) => sum + Number(p.quantity || 0), 0)
    }

    return NextResponse.json({ stockStates: stockStates.rows, productStates: productStates.rows, summary })
  } catch (error) {
    console.error('Stock States error:', error)
    return NextResponse.json({ stockStates: [], productStates: [], summary: { total: 0, available: 0, reserved: 0, allocated: 0, quarantine: 0, damaged: 0, inTransit: 0 } })
  }
}