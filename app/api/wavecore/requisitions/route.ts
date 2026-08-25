export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const result = await pool.query(
      `SELECT * FROM "PurchaseRequisition" WHERE "organizationId" = $1 ORDER BY "createdAt" DESC`,
      [session.organizationId]
    )

    return NextResponse.json({ requisitions: result.rows })
  } catch (error) {
    console.error('Requisitions GET error:', error)
    return NextResponse.json({ requisitions: [] })
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
      `INSERT INTO "PurchaseRequisition" (id, description, status, "organizationId", "createdAt")
       VALUES ($1, $2, $3, $4, NOW())
       RETURNING *`,
      [id, body.description, body.status || 'PENDING', session.organizationId]
    )

    return NextResponse.json({ requisition: result.rows[0] }, { status: 201 })
  } catch (error) {
    console.error('Requisitions POST error:', error)
    return NextResponse.json({ error: 'Failed to create requisition: ' + (error as Error).message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    await pool.query(`DELETE FROM "PurchaseRequisition" WHERE id = $1 AND "organizationId" = $2`, [id, session.organizationId])

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete requisition' }, { status: 500 })
  }
}