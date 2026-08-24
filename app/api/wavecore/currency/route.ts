export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

// GET: List currencies
export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const result = await pool.query(
      `SELECT * FROM "Currency" WHERE "organizationId" = $1 ORDER BY "isdefault" DESC, code`,
      [session.organizationId]
    )

    return NextResponse.json({ currencies: result.rows })
  } catch (error) {
    console.error('Currency GET error:', error)
    return NextResponse.json({ currencies: [] })
  }
}

// POST: Create/Update currency
export async function POST(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()

    const result = await pool.query(
      `INSERT INTO "Currency" (code, name, rate, isdefault, "organizationId", "updatedat")
       VALUES ($1, $2, $3, $4, $5, NOW())
       ON CONFLICT ("organizationId", code) 
       DO UPDATE SET name = $2, rate = $3, isdefault = $4, "updatedat" = NOW()
       RETURNING *`,
      [body.code, body.name, body.rate, body.isdefault || false, session.organizationId]
    )

    return NextResponse.json({ currency: result.rows[0], success: true })
  } catch (error) {
    console.error('Currency POST error:', error)
    return NextResponse.json({ error: 'Failed to save currency' }, { status: 500 })
  }
}

// DELETE: Delete currency
export async function DELETE(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    await pool.query(`DELETE FROM "Currency" WHERE id = $1 AND "organizationId" = $2`, [id, session.organizationId])

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete currency' }, { status: 500 })
  }
}