import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { compare } from 'bcryptjs'
import { sign } from 'jsonwebtoken'

// Rate limiting
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const bucket = rateLimitMap.get(ip)
  
  if (!bucket || bucket.resetAt < now) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 900000 }) // 15 min window
    return true
  }
  
  if (bucket.count >= 5) {
    return false
  }
  
  bucket.count++
  return true
}

// Input sanitization
function sanitizeInput(input: string): string {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .trim()
}

// Generate JWT token
function generateToken(userId: string, organizationId: string): string {
  const secret = process.env.JWT_SECRET || 'wavecore-secret-key'
  return sign(
    { userId, organizationId, type: 'access' },
    secret,
    { expiresIn: '24h' }
  )
}

// Security headers
const securityHeaders = {
  'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'",
  'X-XSS-Protection': '1; mode=block',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'X-Frame-Options': 'DENY',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    
    // Rate limiting - prevent brute force
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Too many login attempts. Please try again in 15 minutes.' },
        { status: 429, headers: { ...securityHeaders, 'Retry-After': '900' } }
      )
    }

    const body = await req.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400, headers: securityHeaders }
      )
    }

    const sanitizedEmail = sanitizeInput(email)

    // Find user
    const userResult = await pool.query(
      `SELECT u.*, o.id as org_id, o.name as org_name
       FROM "User" u
       LEFT JOIN "Organization" o ON o."ownerId" = u.id
       WHERE u.email = $1 AND u."isActive" = true`,
      [sanitizedEmail]
    )

    if (userResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401, headers: securityHeaders }
      )
    }

    const user = userResult.rows[0]

    // Verify password with bcrypt
    let passwordValid = false
    try {
      if (user.password) {
        passwordValid = await compare(password, user.password)
      }
    } catch (err) {
      // If password is not bcrypt hashed (legacy), do plain comparison
      passwordValid = user.password === password
    }

    if (!passwordValid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401, headers: securityHeaders }
      )
    }

    // Create session
    const crypto = require('crypto')
    const sessionToken = crypto.randomUUID()

    await pool.query(
      `INSERT INTO "Session" (id, "userId", "sessionToken", expires)
       VALUES ($1, $2, $3, NOW() + INTERVAL '24 hours')`,
      [sessionToken, user.id, sessionToken]
    )

    // Check subscription
    const subResult = await pool.query(
      `SELECT * FROM "Subscription" WHERE "organizationId" = $1 AND status = 'ACTIVE' AND "endDate" > NOW() LIMIT 1`,
      [user.org_id]
    )

    // Generate JWT
    const jwtToken = generateToken(user.id, user.org_id)

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
      token: jwtToken,
      tokenExpiresIn: '24h'
    })

    // Secure cookie - 24 hours
    response.cookies.set('wavecore_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60,
      path: '/',
    })

    // Apply security headers
    Object.entries(securityHeaders).forEach(([key, value]) => {
      response.headers.set(key, value)
    })

    return response
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Unable to process login. Please try again.' },
      { status: 500, headers: securityHeaders }
    )
  }
}