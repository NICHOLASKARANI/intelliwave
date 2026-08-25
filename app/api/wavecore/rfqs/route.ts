export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const result = await pool.query(
      `SELECT * FROM "RFQ" WHERE "organizationId" = $1 ORDER BY "createdAt" DESC`,
      [session.organizationId]
    )

    return NextResponse.json({ rfqs: result.rows })
  } catch (error) {
    console.error('RFQs GET error:', error)
    return NextResponse.json({ rfqs: [] })
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
      `INSERT INTO "RFQ" (id, title, status, "organizationId", "createdAt")
       VALUES ($1, $2, $3, $4, NOW())
       RETURNING *`,
      [id, body.title, body.status || 'OPEN', session.organizationId]
    )

    return NextResponse.json({ rfq: result.rows[0] }, { status: 201 })
  } catch (error) {
    console.error('RFQs POST error:', error)
    return NextResponse.json({ error: 'Failed to create RFQ: ' + (error as Error).message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    await pool.query(`DELETE FROM "RFQ" WHERE id = $1 AND "organizationId" = $2`, [id, session.organizationId])

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete RFQ' }, { status: 500 })
  }
}