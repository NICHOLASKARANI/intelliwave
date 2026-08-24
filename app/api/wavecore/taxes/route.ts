export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

// GET: List tax rates
export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const result = await pool.query(
      `SELECT * FROM "TaxRate" WHERE "organizationId" = $1 ORDER BY "createdat" DESC`,
      [session.organizationId]
    )

    return NextResponse.json({ taxes: result.rows })
  } catch (error) {
    console.error('Taxes GET error:', error)
    return NextResponse.json({ taxes: [] })
  }
}

// POST: Create tax rate
export async function POST(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()

    const result = await pool.query(
      `INSERT INTO "TaxRate" (name, rate, type, active, "organizationId", "createdat")
       VALUES ($1, $2, $3, $4, $5, NOW())
       RETURNING *`,
      [body.name, body.rate, body.type || 'VAT', body.active !== false, session.organizationId]
    )

    return NextResponse.json({ tax: result.rows[0] }, { status: 201 })
  } catch (error) {
    console.error('Taxes POST error:', error)
    return NextResponse.json({ error: 'Failed to create tax rate' }, { status: 500 })
  }
}

// DELETE: Delete tax rate
export async function DELETE(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    await pool.query(`DELETE FROM "TaxRate" WHERE id = $1 AND "organizationId" = $2`, [id, session.organizationId])

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete tax rate' }, { status: 500 })
  }
}