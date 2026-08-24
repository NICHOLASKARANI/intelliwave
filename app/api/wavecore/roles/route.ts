export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

// GET: List roles
export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const result = await pool.query(
      `SELECT * FROM "Role" WHERE "organizationId" = $1 ORDER BY "createdat" DESC`,
      [session.organizationId]
    )

    return NextResponse.json({ roles: result.rows })
  } catch (error) {
    console.error('Roles GET error:', error)
    return NextResponse.json({ roles: [] })
  }
}

// POST: Create role
export async function POST(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()

    const result = await pool.query(
      `INSERT INTO "Role" (name, description, permissions, "organizationId", "createdat")
       VALUES ($1, $2, $3, $4, NOW())
       RETURNING *`,
      [body.name, body.description || '', body.permissions || [], session.organizationId]
    )

    return NextResponse.json({ role: result.rows[0] }, { status: 201 })
  } catch (error) {
    console.error('Roles POST error:', error)
    return NextResponse.json({ error: 'Failed to create role' }, { status: 500 })
  }
}

// DELETE: Delete role
export async function DELETE(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    await pool.query(`DELETE FROM "Role" WHERE id = $1 AND "organizationId" = $2`, [id, session.organizationId])

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete role' }, { status: 500 })
  }
}