export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    
    const result = await pool.query(
      `SELECT * FROM "Project" WHERE id = $1 AND "clientId" = $2`,
      [params.id, session.userId]
    )
    return NextResponse.json({ project: result.rows[0] || null })
  } catch (error) {
    return NextResponse.json({ project: null })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    
    const body = await request.json()
    const result = await pool.query(
      `UPDATE "Project" SET title = $1, description = $2, "updatedAt" = NOW() WHERE id = $3 AND "clientId" = $4 RETURNING *`,
      [body.title, body.description, params.id, session.userId]
    )
    return NextResponse.json({ project: result.rows[0] })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  }
}