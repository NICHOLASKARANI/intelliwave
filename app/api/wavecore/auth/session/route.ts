export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { checkRedisRateLimit } from '@/lib/wavecore/security/redis-limiter'

// ============================================================
// Session endpoint — returns the authenticated user, their org,
// and CURRENT subscription status (read from DB, not cookie cache).
//
// Response shape (superset of the old shape for backwards compatibility):
// {
//   session: { user, expires },        // ← old shape, still present
//   authenticated: true,
//   user: { id, name, email, role, isActive },
//   organization: { id, name } | null,
//   subscribed: boolean,               // ← true if ACTIVE and not expired
//   subscriptionStatus: 'ACTIVE' | 'TRIAL' | 'EXPIRED' | 'PAST_DUE' | 'CANCELLED' | null,
//   subscriptionEndDate: ISO string | null,
//   daysLeft: number | null,
// }
// ============================================================

export async function GET(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    const rateLimit = await checkRedisRateLimit('session:' + ip, 100, 60)
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    const sessionToken = req.cookies.get('wavecore_session')?.value
    if (!sessionToken) {
      return NextResponse.json({
        session: null,
        authenticated: false,
      })
    }

    const result = await pool.query(
      `SELECT
         s.*,
         u.id    AS "userId",
         u.name,
         u.email,
         u.role,
         u."isActive",
         u."organizationId"
       FROM "Session" s
       JOIN "User" u ON s."userId" = u.id
       WHERE s."sessionToken" = $1
         AND s.expires > NOW()
         AND u."isActive" = true`,
      [sessionToken]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({
        session: null,
        authenticated: false,
      })
    }

    const row = result.rows[0]
    const orgId = row.organizationId as string | null

    // Load org name
    let orgName: string | null = null
    if (orgId) {
      const orgRes = await pool.query(
        `SELECT name FROM "Organization" WHERE id = $1`,
        [orgId]
      )
      orgName = orgRes.rows[0]?.name || null
    }

    // ─── Subscription check (DB truth) ───
    let subscribed = false
    let subscriptionStatus: string | null = null
    let subscriptionEndDate: string | null = null
    let daysLeft: number | null = null

    if (orgId) {
      // ─── Admin/testing bypass ───
      const BYPASS_EMAILS = ['intelliwavehr@gmail.com']
      const isBypassUser = BYPASS_EMAILS.includes(String(row.email || '').toLowerCase())

      const subRes = await pool.query(
        `SELECT status, "endDate", "trialEndsAt"
         FROM "Subscription"
         WHERE "organizationId" = $1
         ORDER BY "createdAt" DESC
         LIMIT 1`,
        [orgId]
      )
      const sub = subRes.rows[0]
      if (isBypassUser) {
        subscribed = true
        subscriptionStatus = 'ACTIVE'
        subscriptionEndDate = null
        daysLeft = 9999
      } else if (sub) {
        subscriptionStatus = sub.status
        const now = Date.now()
        const end = sub.endDate ? new Date(sub.endDate).getTime() : null
        const trialEnd = sub.trialEndsAt ? new Date(sub.trialEndsAt).getTime() : null

        // "subscribed" = has an ACTIVE paid plan that hasn't expired yet
        if (sub.status === 'ACTIVE' && end && end > now) {
          subscribed = true
          subscriptionEndDate = sub.endDate
          daysLeft = Math.ceil((end - now) / (1000 * 60 * 60 * 24))
        } else if (sub.status === 'TRIAL' && trialEnd && trialEnd > now) {
          // Trial active — allow access
          subscribed = true
          subscriptionEndDate = sub.trialEndsAt
          daysLeft = Math.ceil((trialEnd - now) / (1000 * 60 * 60 * 24))
        } else {
          // Expired or inactive
          subscribed = false
          subscriptionEndDate = sub.endDate || sub.trialEndsAt || null
        }
      }
    }

    // Build response (superset — old + new shapes)
    const response = NextResponse.json({
      // ─── Old shape (kept for backwards compat) ───
      session: {
        user: row,
        expires: row.expires,
      },

      // ─── New top-level shape (matches layout + middleware) ───
      authenticated: true,
      user: {
        id: row.userId,
        name: row.name,
        email: row.email,
        role: row.role,
        isActive: row.isActive,
      },
      organization: orgId
        ? { id: orgId, name: orgName }
        : null,
      subscribed,
      subscriptionStatus,
      subscriptionEndDate,
      daysLeft,
    })

    // ─── Set cookies so middleware has fast access ───
    // These are non-sensitive flags only (never the session token)
    response.cookies.set('wavecore_subscribed', subscribed ? 'true' : 'false', {
      path: '/',
      sameSite: 'lax',
      httpOnly: false,
      maxAge: 60 * 60 * 24, // 1 day
    })
    if (row.role) {
      response.cookies.set('wavecore_role', String(row.role), {
        path: '/',
        sameSite: 'lax',
        httpOnly: false,
        maxAge: 60 * 60 * 24,
      })
    }

    return response
  } catch (error) {
    console.error('Session error:', error)
    return NextResponse.json({
      session: null,
      authenticated: false,
    })
  }
}