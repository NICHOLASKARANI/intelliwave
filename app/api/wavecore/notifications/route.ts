export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)

    const result = await pool.query(
      `SELECT id, type, title, content, "isRead", "createdAt"
       FROM "Notification"
       WHERE "userId" = $1 OR "organizationId" = $2
       ORDER BY "createdAt" DESC
       LIMIT 50`,
      [session!.userId, session!.organizationId]
    )

    const unreadCount = result.rows.filter(n => !n.isRead).length

    return NextResponse.json({
      notifications: result.rows,
      unreadCount,
    })
  } catch (error) {
    console.error('Notifications error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Mark all as read
export async function PUT(request: NextRequest) {
  try {
    const session = await requireTenant(request)

    await pool.query(
      'UPDATE "Notification" SET "isRead" = true WHERE ("userId" = $1 OR "organizationId" = $2) AND "isRead" = false',
      [session!.userId, session!.organizationId]
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Notifications update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}