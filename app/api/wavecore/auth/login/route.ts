import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { compare } from 'bcryptjs'
import { sign } from 'jsonwebtoken'
import { checkRedisRateLimit } from '@/lib/wavecore/security/redis-limiter'

// Generate JWT token
function generateToken(userId: string, organizationId: string): string {
  const secret = process.env.JWT_SECRET || 'wavecore-secret-key'
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
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    
    // Redis rate limiting - 5 attempts per 15 min per IP
    const rateLimit = await checkRedisRateLimit(`login:${ip}`, 5, 900)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many login attempts. Try again later.' },
        { status: 429, headers: { ...securityHeaders, 'Retry-After': String(rateLimit.retryAfter) } }
      )
    }

    const body = await req.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 })
    }

    const userResult = await pool.query(
      `SELECT u.*, o.id as org_id FROM "User" u LEFT JOIN "Organization" o ON o."ownerId" = u.id WHERE u.email = $1 AND u."isActive" = true`,
      [email]
    )

    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    const user = userResult.rows[0]
    
    let passwordValid = false
    try {
      if (user.password) {
        passwordValid = await compare(password, user.password)
      }
    } catch {
      passwordValid = user.password === password
    }

    if (!passwordValid) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    const crypto = require('crypto')
    const sessionToken = crypto.randomUUID()

    await pool.query(
      `INSERT INTO "Session" (id, "userId", "sessionToken", expires) VALUES ($1, $2, $3, NOW() + INTERVAL '24 hours')`,
      [sessionToken, user.id, sessionToken]
    )

    const jwtToken = generateToken(user.id, user.org_id)

    const response = NextResponse.json({
      success: true,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, organizationId: user.org_id },
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
    console.error('Login error:', error)
    return NextResponse.json({ error: 'Unable to process login' }, { status: 500 })
  }
}