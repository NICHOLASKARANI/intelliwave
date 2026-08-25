export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const result = await pool.query(
      `SELECT * FROM "GoodsReceipt" WHERE "organizationId" = $1 ORDER BY "receivedAt" DESC`,
      [session.organizationId]
    )

    return NextResponse.json({ receipts: result.rows })
  } catch (error) {
    console.error('GoodsReceipts GET error:', error)
    return NextResponse.json({ receipts: [] })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const crypto = require('crypto')
    const id = crypto.randomUUID()

    const result = await pool.query(
      `INSERT INTO "GoodsReceipt" (id, "purchaseOrderId", quantity, "receivedAt", "organizationId")
       VALUES ($1, $2, $3, NOW(), $4)
       RETURNING *`,
      [id, body.purchaseOrderId, body.quantity || 0, session.organizationId]
    )

    return NextResponse.json({ receipt: result.rows[0] }, { status: 201 })
  } catch (error) {
    console.error('GoodsReceipts POST error:', error)
    return NextResponse.json({ error: 'Failed to create receipt: ' + (error as Error).message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    await pool.query(`DELETE FROM "GoodsReceipt" WHERE id = $1 AND "organizationId" = $2`, [id, session.organizationId])

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete receipt' }, { status: 500 })
  }
}