import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { hash } from 'bcryptjs'
import { sign } from 'jsonwebtoken'

// Rate limiting (in-memory)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const bucket = rateLimitMap.get(ip)
  
  if (!bucket || bucket.resetAt < now) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 3600000 })
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

// Validate email
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Validate password strength
function isStrongPassword(password: string): boolean {
  const minLength = 8
  const hasUpperCase = /[A-Z]/.test(password)
  const hasLowerCase = /[a-z]/.test(password)
  const hasNumber = /[0-9]/.test(password)
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password)
  
  return password.length >= minLength && hasUpperCase && hasLowerCase && hasNumber && hasSpecial
}

// Generate JWT token
function generateToken(userId: string, organizationId: string): string {
  const secret = process.env.JWT_SECRET || 'process.env.JWT_SECRET || '''
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
    // Get client IP
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    
    // Rate limiting
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Too many signup attempts. Please try again later.' },
        { status: 429, headers: { ...securityHeaders, 'Retry-After': '3600' } }
      )
    }

    const body = await req.json()
    const { name, email, phone, password } = body

    // Sanitize inputs
    const sanitizedName = sanitizeInput(name || '')
    const sanitizedEmail = sanitizeInput(email || '')
    const sanitizedPhone = sanitizeInput(phone || '')

    // Validate inputs
    if (!sanitizedName || !sanitizedEmail || !password) {
      return NextResponse.json(
        { error: 'Name, email, and password are required' },
        { status: 400, headers: securityHeaders }
      )
    }

    if (!isValidEmail(sanitizedEmail)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400, headers: securityHeaders }
      )
    }

    if (!isStrongPassword(password)) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters with uppercase, lowercase, number, and special character' },
        { status: 400, headers: securityHeaders }
      )
    }

    // Check if email exists
    const existing = await pool.query('SELECT id FROM "User" WHERE email = $1', [sanitizedEmail])
    if (existing.rows.length > 0) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 409, headers: securityHeaders }
      )
    }

    // Hash password with bcrypt
    const hashedPassword = await hash(password, 12)

    // Create user
    const crypto = require('crypto')
    const userId = crypto.randomUUID()
    const orgId = crypto.randomUUID()
    const sessionToken = crypto.randomUUID()

    const userResult = await pool.query(
      `INSERT INTO "User" (id, name, email, phone, password, role, "isActive", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, 'TENANT_ADMIN', true, NOW(), NOW())
       RETURNING id, name, email, phone, role, "isActive", "createdAt"`,
      [userId, sanitizedName, sanitizedEmail, sanitizedPhone || null, hashedPassword]
    )

    // Create organization
    const orgResult = await pool.query(
      `INSERT INTO "Organization" (id, name, "ownerId", "isActive", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, true, NOW(), NOW())
       RETURNING id, name`,
      [orgId, `${sanitizedName}'s Business`, userId]
    )

    // Create secure session
    await pool.query(
      `INSERT INTO "Session" (id, "userId", "sessionToken", expires)
       VALUES ($1, $2, $3, NOW() + INTERVAL '24 hours')`,
      [sessionToken, userId, sessionToken]
    )

    // Generate JWT token
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

    // Set secure cookie
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
    console.error('Signup error:', error)
    return NextResponse.json(
      { error: 'Unable to process signup. Please try again.' },
      { status: 500, headers: securityHeaders }
    )
  }
}