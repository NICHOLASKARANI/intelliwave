import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 })
    }

    // Find user
    const userResult = await pool.query(
      `SELECT u.*, o.id as org_id, o.name as org_name
       FROM "User" u
       JOIN "Organization" o ON o.id = u."organizationId"
       WHERE u.email = $1 AND u."isActive" = true`,
      [email]
    )

    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    const user = userResult.rows[0]

    // In production, verify password hash
    // For now, simple check (password should be hashed in real implementation)

    // Create session
    const crypto = require('crypto')
    const sessionToken = crypto.randomUUID()

    await pool.query(
      `INSERT INTO "Session" (id, "userId", "sessionToken", expires, "createdAt")
       VALUES ($1, $2, $3, NOW() + INTERVAL '7 days', NOW())`,
      [sessionToken, user.id, sessionToken]
    )

    // Check subscription
    const subResult = await pool.query(
      `SELECT * FROM "Subscription" WHERE "organizationId" = $1 AND status = 'ACTIVE' AND "endDate" > NOW() LIMIT 1`,
      [user.org_id]
    )

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        organizationId: user.org_id,
        orgName: user.org_name,
      },
      subscribed: subResult.rows.length > 0,
      requiresPayment: subResult.rows.length === 0,
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
    console.error('Login error:', error)
    return NextResponse.json({ error: 'Login failed' }, { status: 500 })
  }
}