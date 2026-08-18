import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, email, phone, password } = body

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Name, email, and password required' }, { status: 400 })
    }

    // Check if email exists
    const existing = await pool.query('SELECT id FROM "User" WHERE email = $1', [email])
    if (existing.rows.length > 0) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 })
    }

    // Create user first
    const crypto = require('crypto')
    const userId = crypto.randomUUID()

    const userResult = await pool.query(
      `INSERT INTO "User" (id, name, email, phone, password, role, "isActive", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, 'TENANT_ADMIN', true, NOW(), NOW())
       RETURNING *`,
      [userId, name, email, phone || null, password]
    )

    // Create organization with ownerId
    const orgId = crypto.randomUUID()

    const orgResult = await pool.query(
      `INSERT INTO "Organization" (id, name, "ownerId", "isActive", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, true, NOW(), NOW())
       RETURNING *`,
      [orgId, `${name}'s Business`, userId]
    )

    // Create session
    const sessionToken = crypto.randomUUID()
    await pool.query(
      `INSERT INTO "Session" (id, "userId", "sessionToken", expires)
       VALUES ($1, $2, $3, NOW() + INTERVAL '7 days')`,
      [sessionToken, userId, sessionToken]
    )

    const response = NextResponse.json({
      success: true,
      user: userResult.rows[0],
      organization: orgResult.rows[0],
      requiresPayment: true,
      subscriptionAmount: 500,
    })

    response.cookies.set('wavecore_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    })

    return response
  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json({ error: 'Signup failed: ' + error.message }, { status: 500 })
  }
}