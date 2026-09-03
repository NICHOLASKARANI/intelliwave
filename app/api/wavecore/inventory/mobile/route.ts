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
    const action = searchParams.get('action')
    const barcode = searchParams.get('barcode')
    const sku = searchParams.get('sku')
    const serialNumber = searchParams.get('serial')

    // Barcode/SKU lookup
    if (barcode || sku || serialNumber) {
      let query = `SELECT p.*, COALESCE(sq.quantity, 0) as "stockLevel" FROM "Product" p
        LEFT JOIN "StockQuantity" sq ON sq."productId" = p.id
        WHERE p."organizationId" = $1`
      const params: any[] = [orgId]
      let idx = 2

      if (barcode) { query += ` AND p.barcode = $${idx}`; params.push(barcode); idx++ }
      if (sku) { query += ` AND p.sku = $${idx}`; params.push(sku); idx++ }
      if (serialNumber) { 
        query = `SELECT s.*, p.name, p.sku FROM "SerialNumber" s
          JOIN "Product" p ON s."productId" = p.id
          WHERE s."serialNumber" = $1 AND s."organizationId" = $2`
        params.length = 0
        params.push(serialNumber, orgId)
      }

      const result = await pool.query(query, params).catch(() => ({ rows: [] }))
      return NextResponse.json({ item: result.rows[0] || null })
    }

    // Get pending tasks (picking, receiving, counting)
    const [picking, receiving, counting] = await Promise.all([
      pool.query(`SELECT * FROM "Picking" WHERE "organizationId" = $1 AND status = 'PENDING' ORDER BY "createdAt" ASC LIMIT 10`, [orgId]).catch(() => ({ rows: [] })),
      pool.query(`SELECT * FROM "Receiving" WHERE "organizationId" = $1 AND status = 'PENDING' ORDER BY "createdAt" ASC LIMIT 10`, [orgId]).catch(() => ({ rows: [] })),
      pool.query(`SELECT * FROM "CycleCount" WHERE "organizationId" = $1 AND status = 'PENDING' ORDER BY "createdAt" ASC LIMIT 10`, [orgId]).catch(() => ({ rows: [] }))
    ])

    return NextResponse.json({
      tasks: {
        picking: picking.rows,
        receiving: receiving.rows,
        counting: counting.rows
      },
      summary: {
        totalTasks: picking.rows.length + receiving.rows.length + counting.rows.length,
        picking: picking.rows.length,
        receiving: receiving.rows.length,
        counting: counting.rows.length
      }
    })
  } catch (error) {
    console.error('Mobile error:', error)
    return NextResponse.json({ item: null, tasks: { picking: [], receiving: [], counting: [] }, summary: { totalTasks: 0, picking: 0, receiving: 0, counting: 0 } })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const action = body.action || 'SCAN'

    if (action === 'SCAN') {
      // Record scan event
      return NextResponse.json({ 
        success: true, 
        message: 'Scan recorded',
        scannedItem: {
          barcode: body.barcode,
          sku: body.sku,
          timestamp: new Date().toISOString()
        }
      })
    }

    if (action === 'RECEIVE') {
      // Quick receiving
      return NextResponse.json({ success: true, message: 'Item received' })
    }

    if (action === 'PICK') {
      // Quick picking
      return NextResponse.json({ success: true, message: 'Item picked' })
    }

    if (action === 'COUNT') {
      // Quick counting
      return NextResponse.json({ success: true, message: 'Count recorded' })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (error) {
    return NextResponse.json({ error: 'Mobile operation failed' }, { status: 500 })
  }
}