export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { checkRedisRateLimit } from '@/lib/wavecore/security/redis-limiter'

/**
 * Nuclear Command Center — master authentication.
 *
 * One password (NUCLEAR_ADMIN_PASSWORD) unlocks the shell.
 * Session is a signed HttpOnly cookie valid for 12 hours.
 *
 * SECURITY:
 *   - Timing-safe password compare
 *   - Rate limited (5 attempts / 15 min per IP)
 *   - HttpOnly + Secure + SameSite=strict cookie
 *   - Does NOT return the password in the response
 */
export async function POST(req: NextRequest) {
  try {
    const masterPassword = process.env.NUCLEAR_ADMIN_PASSWORD
    if (!masterPassword) {
      return NextResponse.json(
        { error: 'Nuclear Command Center not configured. Add NUCLEAR_ADMIN_PASSWORD to env vars.' },
        { status: 500 }
      )
    }

    // ─── Rate limit (protects against brute-force) ───
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    const rl = await checkRedisRateLimit('nuclear:' + ip, 5, 900)
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Too many attempts. Try again in 15 minutes.' },
        { status: 429 }
      )
    }

    const body = await req.json().catch(() => ({}))
    const password = (body.password || '').toString()

    if (!password) return NextResponse.json({ error: 'Password required' }, { status: 400 })

    // ─── Timing-safe comparison ───
    const a = Buffer.from(password)
    const b = Buffer.from(masterPassword)
    const match = a.length === b.length && crypto.timingSafeEqual(a, b)

    if (!match) {
      return NextResponse.json({ error: 'Access denied' }, { status: 401 })
    }

    // ─── Generate signed session token ───
    const secret = process.env.JWT_SECRET || masterPassword
    const token = crypto.createHmac('sha256', secret).update('nuclear:' + Date.now().toString() + ':' + crypto.randomBytes(8).toString('hex')).digest('hex')
    const expiresAt = Date.now() + 12 * 60 * 60 * 1000  // 12 hours

    // ─── Do NOT return password to client ───
    // The shell already has the password (the user typed it) and can store it in sessionStorage.
    const res = NextResponse.json({
      success: true,
      expiresAt,
    })

    res.cookies.set('nuclear_session', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 12 * 60 * 60,
      path: '/',
    })

    return res
  } catch (error: any) {
    console.error('Nuclear verify error:', error?.message)
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 })
  }
}