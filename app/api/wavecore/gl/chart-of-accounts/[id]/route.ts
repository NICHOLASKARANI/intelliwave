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
    const orgId = session.organizationId

    const result = await pool.query(
      `SELECT id, code, name, type, "parentId", "isActive", "isReconcilable", description
       FROM "ChartOfAccount"
       WHERE id = $1 AND "organizationId" = $2`,
      [params.id, orgId]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 })
    }

    return NextResponse.json({ account: result.rows[0] })
  } catch (error) {
    console.error('ChartOfAccount [id] GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireTenant()
    const orgId = session.organizationId

    const result = await pool.query(
      'DELETE FROM "ChartOfAccount" WHERE id = $1 AND "organizationId" = $2',
      [params.id, orgId]
    )

    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, message: 'Account deleted' })
  } catch (error) {
    console.error('ChartOfAccount [id] DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}