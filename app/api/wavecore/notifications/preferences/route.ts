export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/wavecore/auth'
import { pool } from '@/lib/wavecore/db'
import { ensurePreferenceRows } from '@/lib/wavecore/notifications'

/**
 * GET  /api/wavecore/notifications/preferences
 *      Ensures all 6 category rows exist for the current user, then lists them.
 *
 * PUT  /api/wavecore/notifications/preferences
 *      Body: { preferences: [{ category, inApp, email }, ...] }
 *      Upserts each row. Uses NotificationPreference unique constraint.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await ensurePreferenceRows(session.userId, session.organizationId)

    const result = await pool.query(
      `SELECT category, "inApp", email FROM "NotificationPreference"
       WHERE "userId" = $1 AND "organizationId" = $2
       ORDER BY category`,
      [session.userId, session.organizationId]
    )

    return NextResponse.json({ preferences: result.rows })
  } catch (error) {
    console.error('[notifications/preferences GET]', error)
    return NextResponse.json({ error: 'Load failed' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const prefs = Array.isArray(body?.preferences) ? body.preferences : []
    if (prefs.length === 0) {
      return NextResponse.json({ error: 'preferences array required' }, { status: 400 })
    }

    for (const p of prefs) {
      if (!p.category) continue
      await pool.query(
        `INSERT INTO "NotificationPreference"
           ("userId", "organizationId", "category", "inApp", "email", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, NOW())
         ON CONFLICT ("userId", "organizationId", "category")
         DO UPDATE SET "inApp" = $4, "email" = $5, "updatedAt" = NOW()`,
        [session.userId, session.organizationId, p.category, !!p.inApp, !!p.email]
      )
    }

    return NextResponse.json({ success: true, saved: prefs.length })
  } catch (error) {
    console.error('[notifications/preferences PUT]', error)
    return NextResponse.json({ error: 'Save failed' }, { status: 500 })
  }
}