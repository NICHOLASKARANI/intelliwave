export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { hash } from 'bcryptjs'
import { sign } from 'jsonwebtoken'
import { checkRedisRateLimit } from '@/lib/wavecore/security/redis-limiter'

function generateToken(userId: string, organizationId: string): string {
  const secret = process.env.JWT_SECRET || ''
  return sign({ userId, organizationId, type: 'access' }, secret, { expiresIn: '24h' })
}

const securityHeaders = {
  'Content-Security-Policy': "default-src 'self'",
  'X-XSS-Protection': '1; mode=block',
  'X-Content-Type-Options': 'nosniff',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'X-Frame-Options': 'DENY'
}

export async function POST(req: NextRequest) {
  const client = await pool.connect()
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    const rateLimit = await checkRedisRateLimit('signup:' + ip, 5, 3600)
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: 'Too many signup attempts. Try again later.' }, { status: 429 })
    }

    const body = await req.json()
    const { name, email, phone, password } = body

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Name, email, and password required' }, { status: 400 })
    }

    const normalizedEmail = String(email).trim().toLowerCase()
    const normalizedPhone = phone ? String(phone).trim().replace(/[\s-]/g, '') : null

    const existingEmail = await client.query(
      'SELECT id FROM "User" WHERE LOWER(email) = $1 LIMIT 1',
      [normalizedEmail]
    )
    if (existingEmail.rows.length > 0) {
      return NextResponse.json({
        error: 'This email is already registered. Please login or use Forgot Password.',
        code: 'EMAIL_EXISTS'
      }, { status: 409 })
    }

    if (normalizedPhone) {
      const existingPhone = await client.query(
        'SELECT id FROM "User" WHERE phone = $1 LIMIT 1',
        [normalizedPhone]
      )
      if (existingPhone.rows.length > 0) {
        return NextResponse.json({
          error: 'This phone number is already registered. Please login or use Forgot Password.',
          code: 'PHONE_EXISTS'
        }, { status: 409 })
      }
    }

    await client.query('BEGIN')

    const hashedPassword = await hash(password, 12)
    const crypto = require('crypto')
    const userId = crypto.randomUUID()
    const orgId = crypto.randomUUID()
    const sessionToken = crypto.randomUUID()

    // STEP 1: Insert User FIRST (with organizationId temporarily null — FK to Organization is not enforced if nullable)
    // We create the user without orgId first, then attach org after.
    await client.query(
      `INSERT INTO "User" (id, name, email, phone, password, role, "isActive", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, 'TENANT_ADMIN', true, NOW(), NOW())`,
      [userId, name.trim(), normalizedEmail, normalizedPhone, hashedPassword]
    )

    // STEP 2: Now insert Organization (ownerId FK now satisfies — User exists)
    await client.query(
      `INSERT INTO "Organization" (id, name, "ownerId", "isActive", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, true, NOW(), NOW())`,
      [orgId, name.trim() + "'s Business", userId]
    )

    // STEP 3: Attach organizationId to User
    const userResult = await client.query(
      `UPDATE "User" SET "organizationId" = $1, "updatedAt" = NOW()
       WHERE id = $2
       RETURNING id, name, email, phone, role, "organizationId", "isActive", "createdAt"`,
      [orgId, userId]
    )

    // STEP 4: Create session
    await client.query(
      `INSERT INTO "Session" (id, "userId", "sessionToken", expires) VALUES ($1, $2, $3, NOW() + INTERVAL '24 hours')`,
      [sessionToken, userId, sessionToken]
    )

    await client.query('COMMIT')

    const jwtToken = generateToken(userId, orgId)

    const response = NextResponse.json({
      success: true,
      user: userResult.rows[0],
      organization: { id: orgId, name: name.trim() + "'s Business" },
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
    try { await client.query('ROLLBACK') } catch {}
    console.error('Signup error:', error)
    return NextResponse.json({ error: (error as Error).message || 'Unable to process signup' }, { status: 500 })
  } finally {
    client.release()
  }
}