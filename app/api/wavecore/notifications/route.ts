export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant()

    const result = await pool.query(
      `SELECT id, type, title, content, "isRead", "createdAt"
       FROM "Notification"
       WHERE "userId" = $1 OR "organizationId" = $2
       ORDER BY "createdAt" DESC
       LIMIT 50`,
      [session.userId, session.organizationId]
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

export async function PUT(request: NextRequest) {
  try {
    const session = await requireTenant()
    const body = await request.json()
    const { notificationId } = body

    if (!notificationId) {
      return NextResponse.json({ error: 'Notification ID required' }, { status: 400 })
    }

    await pool.query(
      'UPDATE "Notification" SET "isRead" = true WHERE id = $1 AND ("userId" = $2 OR "organizationId" = $3)',
      [notificationId, session.userId, session.organizationId]
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Notification update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}