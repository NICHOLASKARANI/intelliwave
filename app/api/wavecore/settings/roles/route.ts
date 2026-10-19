export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const result = await pool.query(
      `SELECT id, name, description, permissions, createdat
       FROM "Role"
       WHERE "organizationId" = $1
       ORDER BY createdat ASC`,
      [session.organizationId]
    )
    return NextResponse.json({ roles: result.rows })
  } catch (error) {
    console.error('Roles GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch roles: ' + (error as Error).message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const result = await pool.query(
      `INSERT INTO "Role" (name, description, permissions, createdat, "organizationId")
       VALUES ($1, $2, $3, NOW(), $4)
       RETURNING id, name, description, permissions, createdat`,
      [body.name, body.description || null, body.permissions || [], session.organizationId]
    )
    return NextResponse.json({ role: result.rows[0] }, { status: 201 })
  } catch (error) {
    console.error('Roles POST error:', error)
    return NextResponse.json({ error: 'Failed to create role: ' + (error as Error).message }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const result = await pool.query(
      `UPDATE "Role"
       SET name = $1, description = $2, permissions = $3
       WHERE id = $4 AND "organizationId" = $5
       RETURNING id, name, description, permissions, createdat`,
      [body.name, body.description, body.permissions, body.id, session.organizationId]
    )
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 })
    }
    return NextResponse.json({ role: result.rows[0] })
  } catch (error) {
    console.error('Roles PUT error:', error)
    return NextResponse.json({ error: 'Failed to update role: ' + (error as Error).message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    const result = await pool.query(
      `DELETE FROM "Role" WHERE id = $1 AND "organizationId" = $2 RETURNING id`,
      [id, session.organizationId]
    )
    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 })
    }
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Roles DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete role: ' + (error as Error).message }, { status: 500 })
  }
}