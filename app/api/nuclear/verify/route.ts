export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

/**
 * Nuclear Command Center — master authentication.
 *
 * One password (NUCLEAR_ADMIN_PASSWORD) unlocks the shell.
 * Session is a signed HttpOnly cookie valid for 12 hours.
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

    const body = await req.json().catch(() => ({}))
    const password = (body.password || '').toString()

    if (!password) return NextResponse.json({ error: 'Password required' }, { status: 400 })

    // Timing-safe comparison
    const a = Buffer.from(password)
    const b = Buffer.from(masterPassword)
    const match = a.length === b.length && crypto.timingSafeEqual(a, b)

    if (!match) {
      return NextResponse.json({ error: 'Access denied' }, { status: 401 })
    }

    // Generate signed session token
    const secret = process.env.JWT_SECRET || masterPassword
    const token = crypto.createHmac('sha256', secret).update('nuclear:' + Date.now().toString()).digest('hex')
    const expiresAt = Date.now() + 12 * 60 * 60 * 1000  // 12 hours

    const res = NextResponse.json({
      success: true,
      expiresAt,
      // Return the password so the shell can pass it to iframes
      // (the shell stores it in memory only — never persisted in localStorage)
      masterPassword,
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