export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { checkRedisRateLimit } from '@/lib/wavecore/security/redis-limiter'

export async function GET(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    const rateLimit = await checkRedisRateLimit('session:' + ip, 100, 60)
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    const sessionToken = req.cookies.get('wavecore_session')?.value

    if (!sessionToken) {
      return NextResponse.json({ session: null })
    }

    const result = await pool.query(
      `SELECT s.*, u.id as "userId", u.name, u.email, u.role, u."isActive"
       FROM "Session" s
       JOIN "User" u ON s."userId" = u.id
       WHERE s."sessionToken" = $1 AND s.expires > NOW() AND u."isActive" = true`,
      [sessionToken]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ session: null })
    }

    return NextResponse.json({
      session: {
        user: result.rows[0],
        expires: result.rows[0].expires
      }
    })
  } catch (error) {
    console.error('Session error:', error)
    return NextResponse.json({ session: null })
  }
}