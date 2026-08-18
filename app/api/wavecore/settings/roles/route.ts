import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const result = await pool.query(
      `SELECT * FROM "Role" ORDER BY "createdAt" ASC`
    )
    return NextResponse.json({ roles: result.rows })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch roles: ' + error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const result = await pool.query(
      `INSERT INTO "Role" (name, description, permissions, "createdAt")
       VALUES ($1, $2, $3, NOW())
       RETURNING *`,
      [body.name, body.description || null, body.permissions || []]
    )
    return NextResponse.json({ role: result.rows[0] }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create role: ' + error.message }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const result = await pool.query(
      `UPDATE "Role" SET name = $1, description = $2, permissions = $3
       WHERE id = $4
       RETURNING *`,
      [body.name, body.description, body.permissions, body.id]
    )
    return NextResponse.json({ role: result.rows[0] })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update role: ' + error.message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    await pool.query(`DELETE FROM "Role" WHERE id = $1`, [id])
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete role: ' + error.message }, { status: 500 })
  }
}