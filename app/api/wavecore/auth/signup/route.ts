export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { hash } from 'bcryptjs'
import { sign } from 'jsonwebtoken'

function generateToken(userId: string, organizationId: string): string {
  const secret = process.env.JWT_SECRET || ''
  return sign(
    { userId, organizationId, type: 'access' },
    secret,
    { expiresIn: '24h' }
  )
}

const securityHeaders = {
  'Content-Security-Policy': "default-src 'self'",
  'X-XSS-Protection': '1; mode=block',
  'X-Content-Type-Options': 'nosniff',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'X-Frame-Options': 'DENY'
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, email, phone, password } = body

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Name, email, and password required' }, { status: 400 })
    }

    const existing = await pool.query('SELECT id FROM "User" WHERE email = $1', [email])
    if (existing.rows.length > 0) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 })
    }

    const hashedPassword = await hash(password, 12)
    const crypto = require('crypto')
    const userId = crypto.randomUUID()
    const orgId = crypto.randomUUID()
    const sessionToken = crypto.randomUUID()

    const userResult = await pool.query(
      `INSERT INTO "User" (id, name, email, phone, password, role, "isActive", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, 'TENANT_ADMIN', true, NOW(), NOW())
       RETURNING id, name, email, phone, role, "isActive", "createdAt"`,
      [userId, name, email, phone || null, hashedPassword]
    )

    const orgResult = await pool.query(
      `INSERT INTO "Organization" (id, name, "ownerId", "isActive", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, true, NOW(), NOW())
       RETURNING id, name`,
      [orgId, name + "'s Business", userId]
    )

    await pool.query(
      `INSERT INTO "Session" (id, "userId", "sessionToken", expires) VALUES ($1, $2, $3, NOW() + INTERVAL '24 hours')`,
      [sessionToken, userId, sessionToken]
    )

    const jwtToken = generateToken(userId, orgId)

    const response = NextResponse.json({
      success: true,
      user: userResult.rows[0],
      organization: orgResult.rows[0],
      requiresPayment: true,
      subscriptionAmount: 500,
      token: jwtToken,
      tokenExpiresIn: '24h'
    })

    response.cookies.set('wavecore_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60,
      path: '/',
    })

    Object.entries(securityHeaders).forEach(([key, value]) => {
      response.headers.set(key, value)
    })

    return response
  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json({ error: 'Unable to process signup' }, { status: 500 })
  }
}