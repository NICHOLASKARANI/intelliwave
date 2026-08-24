export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

// GET: List integrations
export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const result = await pool.query(
      `SELECT * FROM "Integration" WHERE "organizationId" = $1 ORDER BY "createdat" DESC`,
      [session.organizationId]
    )

    return NextResponse.json({ integrations: result.rows })
  } catch (error) {
    console.error('Integrations GET error:', error)
    return NextResponse.json({ integrations: [] })
  }
}

// POST: Create integration
export async function POST(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()

    const result = await pool.query(
      `INSERT INTO "Integration" (name, type, apikey, status, "organizationId", "createdat")
       VALUES ($1, $2, $3, $4, $5, NOW())
       RETURNING *`,
      [body.name, body.type, body.apikey || '', body.status || 'Disconnected', session.organizationId]
    )

    return NextResponse.json({ integration: result.rows[0] }, { status: 201 })
  } catch (error) {
    console.error('Integrations POST error:', error)
    return NextResponse.json({ error: 'Failed to create integration' }, { status: 500 })
  }
}

// DELETE: Delete integration
export async function DELETE(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    await pool.query(`DELETE FROM "Integration" WHERE id = $1 AND "organizationId" = $2`, [id, session.organizationId])

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete integration' }, { status: 500 })
  }
}