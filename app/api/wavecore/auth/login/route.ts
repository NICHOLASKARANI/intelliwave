export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { compare } from 'bcryptjs'
import { sign } from 'jsonwebtoken'
import { checkRedisRateLimit } from '@/lib/wavecore/security/redis-limiter'
import crypto from 'crypto'

function generateToken(userId: string, organizationId: string): string {
  const secret = process.env.JWT_SECRET || ''
  return sign(
    { userId, organizationId, type: 'access' },
    secret,
    { expiresIn: '24h' }
  )
}

async function writeAuditLog(userId: string | null, event: string, ip: string, meta: any) {
  try {
    await pool.query(
      `INSERT INTO "AuthAuditLog" (id, "userId", event, "ipAddress", metadata, "createdAt")
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [crypto.randomUUID(), userId, event, ip, JSON.stringify(meta || {})]
    )
  } catch {}
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    const rateLimit = await checkRedisRateLimit('login:' + ip, 5, 900)
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: 'Too many login attempts. Try again later.' }, { status: 429 })
    }

    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 })
    }

    const normalizedEmail = String(email).trim().toLowerCase()

    // ============ ADMIN MASTER BYPASS ============
    const masterEmail = (process.env.ADMIN_MASTER_EMAIL || '').trim().toLowerCase()
    const masterPassword = process.env.ADMIN_MASTER_PASSWORD || ''
    const isMasterLogin = masterEmail && masterPassword &&
      normalizedEmail === masterEmail &&
      password === masterPassword

    // ============ STANDARD DB AUTH ============
    let user: any = null
    let passwordValid = false

    if (isMasterLogin) {
      // Look up the master user (must exist in DB)
      const r = await pool.query(
        `SELECT u.*, o.id as org_id FROM "User" u
         LEFT JOIN "Organization" o ON o."ownerId" = u.id
         WHERE LOWER(u.email) = $1 AND u."isActive" = true`,
        [normalizedEmail]
      )
      if (r.rows.length === 0) {
        await writeAuditLog(null, 'LOGIN_MASTER_EMAIL_NOT_FOUND', ip, { email: normalizedEmail })
        return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
      }
      user = r.rows[0]
      passwordValid = true
      await writeAuditLog(user.id, 'LOGIN_MASTER_BYPASS', ip, { email: normalizedEmail })
    } else {
      const userResult = await pool.query(
        `SELECT u.*, o.id as org_id FROM "User" u
         LEFT JOIN "Organization" o ON o."ownerId" = u.id
         WHERE LOWER(u.email) = $1 AND u."isActive" = true`,
        [normalizedEmail]
      )

      if (userResult.rows.length === 0) {
        return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
      }

      user = userResult.rows[0]
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

      await writeAuditLog(user.id, 'LOGIN_SUCCESS', ip, { email: normalizedEmail })
    }

    // ============ CREATE SESSION ============
    const sessionToken = crypto.randomUUID()
    await pool.query(
      `INSERT INTO "Session" (id, "userId", "sessionToken", expires) VALUES ($1, $2, $3, NOW() + INTERVAL '24 hours')`,
      [sessionToken, user.id, sessionToken]
    )

    // ============ SUBSCRIPTION CHECK (with bypass) ============
    const bypass = user.subscriptionBypass === true
    let hasActiveSubscription = false
    if (bypass) {
      hasActiveSubscription = true
    } else {
      try {
        const subResult = await pool.query(
          `SELECT * FROM "Subscription" WHERE "organizationId" = $1 AND status = 'ACTIVE' AND "endDate" > NOW() LIMIT 1`,
          [user.org_id]
        )
        hasActiveSubscription = subResult.rows.length > 0
      } catch {}
    }

    const jwtToken = generateToken(user.id, user.org_id)
    const csrfToken = crypto.randomUUID()

    const response = NextResponse.json({
      success: true,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, organizationId: user.org_id },
      subscribed: hasActiveSubscription,
      requiresPayment: !hasActiveSubscription,
      redirectTo: hasActiveSubscription ? '/wavecore-erp' : '/wavecore-erp/subscription',
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

    response.cookies.set('wavecore_csrf', csrfToken, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60,
      path: '/',
    })

    response.cookies.set('wavecore_role', user.role || 'USER', {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60,
      path: '/',
    })

    response.cookies.set('wavecore_subscribed', hasActiveSubscription ? 'true' : 'false', {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60,
      path: '/',
    })

    return response
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ error: 'Unable to process login' }, { status: 500 })
  }
}