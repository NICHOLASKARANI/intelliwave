export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const result = await pool.query(`SELECT * FROM "Routing" WHERE "organizationId" = $1 ORDER BY "createdAt" DESC`, [session.organizationId])
    return NextResponse.json({ routings: result.rows })
  } catch (error) {
    return NextResponse.json({ routings: [] })
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
      `INSERT INTO "Routing" (id, name, "organizationId", "createdAt") VALUES ($1, $2, $3, NOW()) RETURNING *`,
      [id, body.name, session.organizationId]
    )
    return NextResponse.json({ routing: result.rows[0] }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create routing' }, { status: 500 })
  }
}