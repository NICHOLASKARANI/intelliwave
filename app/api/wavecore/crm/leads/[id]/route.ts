export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireTenant()
    const result = await pool.query(
      'SELECT * FROM "Lead" WHERE id = $1 AND "organizationId" = $2',
      [params.id, session.organizationId]
    )
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }
    return NextResponse.json({ lead: result.rows[0] })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireTenant()
    const body = await request.json()

    const result = await pool.query(
      `UPDATE "Lead" SET name = $1, email = $2, phone = $3, company = $4, status = $5, "updatedAt" = NOW()
       WHERE id = $6 AND "organizationId" = $7 RETURNING id`,
      [body.name, body.email || null, body.phone || null, body.company || null, body.status || 'NEW', params.id, session.organizationId]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireTenant()
    const result = await pool.query(
      'DELETE FROM "Lead" WHERE id = $1 AND "organizationId" = $2',
      [params.id, session.organizationId]
    )
    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}