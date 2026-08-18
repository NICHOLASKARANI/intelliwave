export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireTenant(request)
    const orgId = session.organizationId

    const result = await pool.query(
      'SELECT * FROM "Customer" WHERE id = $1 AND "organizationId" = $2',
      [params.id, orgId]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    return NextResponse.json({ customer: result.rows[0] })
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireTenant(request)
    const orgId = session.organizationId

    const body = await request.json()

    const result = await pool.query(
      `UPDATE "Customer" SET name = $1, email = $2, phone = $3, company = $4, "updatedAt" = NOW()
       WHERE id = $5 AND "organizationId" = $6
       RETURNING id, name, email`,
      [body.name, body.email || null, body.phone || null, body.company || null, params.id, orgId]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, customer: result.rows[0] })
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireTenant(request)
    const orgId = session.organizationId

    const result = await pool.query(
      'DELETE FROM "Customer" WHERE id = $1 AND "organizationId" = $2',
      [params.id, orgId]
    )

    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}