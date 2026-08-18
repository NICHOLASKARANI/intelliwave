export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const result = await pool.query(
      `SELECT * FROM "Project" ORDER BY "createdAt" DESC LIMIT 100`
    )
    return NextResponse.json({ projects: result.rows })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const result = await pool.query(
      `INSERT INTO "Project" (id, title, description, status, "createdAt", "updatedAt")
       VALUES (gen_random_uuid()::text, $1, $2, 'ACTIVE', NOW(), NOW())
       RETURNING *`,
      [body.title, body.description || null]
    )
    return NextResponse.json({ project: result.rows[0] }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const result = await pool.query(
      `UPDATE "Project" SET title = $1, description = $2, status = $3, "updatedAt" = NOW()
       WHERE id = $4
       RETURNING *`,
      [body.title, body.description, body.status || 'ACTIVE', body.id]
    )
    if (result.rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ project: result.rows[0] })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    await pool.query(`DELETE FROM "Project" WHERE id = $1`, [id])
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}