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

    // Create organization
    const crypto = require('crypto')
    const orgId = crypto.randomUUID()

    const orgResult = await pool.query(
      `INSERT INTO "Organization" (id, name, "isActive", "createdAt", "updatedAt")
       VALUES ($1, $2, true, NOW(), NOW())
       RETURNING *`,
      [orgId, `${name}'s Business`]
    )

    // Create user
    const userId = crypto.randomUUID()

    const userResult = await pool.query(
      `INSERT INTO "User" (id, name, email, phone, role, "organizationId", "isActive", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, 'TENANT_ADMIN', $5, true, NOW(), NOW())
       RETURNING *`,
      [userId, name, email, phone || null, orgId]
    )

    // Create session
    const sessionToken = crypto.randomUUID()
    await pool.query(
      `INSERT INTO "Session" (id, "userId", "sessionToken", expires, "createdAt")
       VALUES ($1, $2, $3, NOW() + INTERVAL '7 days', NOW())`,
      [sessionToken, userId, sessionToken]
    )

    const response = NextResponse.json({
      success: true,
      user: userResult.rows[0],
      organization: orgResult.rows[0],
      requiresPayment: true,
      subscriptionAmount: 500,
    })

    // Set session cookie
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
    return NextResponse.json({ error: 'Signup failed' }, { status: 500 })
  }
}