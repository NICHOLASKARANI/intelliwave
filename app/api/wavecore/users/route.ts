export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

// GET: List users
export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const result = await pool.query(
      `SELECT id, name, email, role, "isActive", "createdAt" FROM "User" WHERE "organizationId" = $1 ORDER BY "createdAt" DESC`,
      [session!.organizationId]
    )

    return NextResponse.json({ users: result.rows })
  } catch (error) {
    console.error('Users GET error:', error)
    return NextResponse.json({ users: [] })
  }
}

// POST: Create user
export async function POST(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const crypto = require('crypto')
    const id = crypto.randomUUID()

    const result = await pool.query(
      `INSERT INTO "User" (id, name, email, role, "isActive", "organizationId", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, true, $5, NOW(), NOW())
       RETURNING id, name, email, role, "isActive", "createdAt"`,
      [id, body.name, body.email, body.role || 'USER', session!.organizationId]
    )

    return NextResponse.json({ user: result.rows[0] }, { status: 201 })
  } catch (error) {
    console.error('Users POST error:', error)
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
  }
}

// DELETE: Delete user
export async function DELETE(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    await pool.query(`DELETE FROM "User" WHERE id = $1 AND "organizationId" = $2`, [id, session!.organizationId])

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 })
  }
}