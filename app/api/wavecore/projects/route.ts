export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    
    const result = await pool.query(
      `SELECT * FROM "Project" WHERE "clientId" = $1 OR "organizationId" = $1 ORDER BY "createdAt" DESC LIMIT 100`,
      [session.userId]
    )
    return NextResponse.json({ projects: result.rows })
  } catch (error) {
    console.error('Projects GET error:', error)
    return NextResponse.json({ projects: [] })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    
    const body = await request.json()
    const result = await pool.query(
      `INSERT INTO "Project" (id, title, description, status, currency, "clientId", "createdAt", "updatedAt")
       VALUES (gen_random_uuid()::text, $1, COALESCE($2, ''), 'ACTIVE', COALESCE($3, 'KES'), $4, NOW(), NOW())
       RETURNING *`,
      [body.title, body.description, body.currency, session.userId]
    )
    return NextResponse.json({ project: result.rows[0] }, { status: 201 })
  } catch (error) {
    console.error('Projects POST error:', error)
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    await pool.query(`DELETE FROM "Project" WHERE id = $1 AND "clientId" = $2`, [id, session.userId])
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
  }
}