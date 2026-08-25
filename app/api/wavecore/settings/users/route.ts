import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session || !session!.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''

    const result = await pool.query(
      `SELECT u.id, u.name, u.email, u.phone, u.role, u."isActive", u."createdAt"
       FROM "User" u
       LEFT JOIN "Organization" o ON o."ownerId" = u.id
       WHERE o.id = $1
       AND (u.name ILIKE $2 OR u.email ILIKE $2)
       ORDER BY u."createdAt" DESC`,
      [session!.organizationId, `%${search}%`]
    )

    return NextResponse.json({ users: result.rows })
  } catch (error) {
    console.error('Users fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch users: ' + (error as Error).message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const crypto = require('crypto')
    const userId = crypto.randomUUID()

    const result = await pool.query(
      `INSERT INTO "User" (id, name, email, role, "isActive", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, true, NOW(), NOW())
       RETURNING *`,
      [userId, body.name, body.email, body.role || 'User']
    )

    return NextResponse.json({ user: result.rows[0] }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create user: ' + (error as Error).message }, { status: 500 })
  }
}