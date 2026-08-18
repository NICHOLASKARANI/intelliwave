import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { getSession } from '@/lib/wavecore/auth'

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search') || ''

    const result = await pool.query(
      `SELECT u.* FROM "User" u
       JOIN "Organization" o ON o.id = u."organizationId"
       WHERE u."organizationId" = $1
       AND (u.name ILIKE $2 OR u.email ILIKE $2)
       ORDER BY u."createdAt" DESC`,
      [session.organizationId, `%${search}%`]
    )

    return NextResponse.json({ users: result.rows })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const result = await pool.query(
      `INSERT INTO "User" (name, email, role, "organizationId", "isActive", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, true, NOW(), NOW())
       RETURNING *`,
      [body.name, body.email, body.role || 'User', session.organizationId]
    )

    return NextResponse.json({ user: result.rows[0] }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const result = await pool.query(
      `UPDATE "User" SET name = $1, email = $2, role = $3, "updatedAt" = NOW()
       WHERE id = $4 AND "organizationId" = $5
       RETURNING *`,
      [body.name, body.email, body.role, body.id, session.organizationId]
    )

    return NextResponse.json({ user: result.rows[0] })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    await pool.query(
      `DELETE FROM "User" WHERE id = $1 AND "organizationId" = $2`,
      [id, session.organizationId]
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 })
  }
}