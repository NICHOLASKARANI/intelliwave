export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

// GET: List webhooks
export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const result = await pool.query(
      `SELECT * FROM "Webhook" WHERE "organizationId" = $1 ORDER BY "createdAt" DESC`,
      [session.organizationId]
    )

    return NextResponse.json({ webhooks: result.rows })
  } catch (error) {
    return NextResponse.json({ webhooks: [] })
  }
}

// POST: Create webhook
export async function POST(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const crypto = require('crypto')
    const id = crypto.randomUUID()

    const result = await pool.query(
      `INSERT INTO "Webhook" (id, name, url, active, "organizationId", "createdAt")
       VALUES ($1, $2, $3, true, $4, NOW())
       RETURNING *`,
      [id, body.name, body.url, session.organizationId]
    )

    return NextResponse.json({ webhook: result.rows[0] }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed: ' + (error as Error).message }, { status: 500 })
  }
}

// PUT: Update webhook
export async function PUT(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const result = await pool.query(
      `UPDATE "Webhook" SET name = $1, url = $2, active = $3 WHERE id = $4 AND "organizationId" = $5 RETURNING *`,
      [body.name, body.url, body.active, body.id, session.organizationId]
    )

    return NextResponse.json({ webhook: result.rows[0] })
  } catch (error) {
    return NextResponse.json({ error: 'Failed: ' + (error as Error).message }, { status: 500 })
  }
}

// DELETE: Delete webhook
export async function DELETE(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    await pool.query(`DELETE FROM "Webhook" WHERE id = $1 AND "organizationId" = $2`, [id, session.organizationId])

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed: ' + (error as Error).message }, { status: 500 })
  }
}