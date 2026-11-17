export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

// GET: List user's notifications (with unread count)
export async function GET(req: NextRequest) {
  try {
    const session = await requireTenant(req)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)
    const unreadOnly = searchParams.get('unreadOnly') === 'true'

    let query = `SELECT id, type, title, content, "isRead", "createdAt"
                 FROM "Notification"
                 WHERE "userId" = $1`
    const params: any[] = [session.userId]

    if (unreadOnly) {
      query += ` AND "isRead" = false`
    }

    query += ` ORDER BY "createdAt" DESC LIMIT $${params.length + 1}`
    params.push(limit)

    const result = await pool.query(query, params)

    // Unread count
    const countRes = await pool.query(
      'SELECT COUNT(*)::int AS count FROM "Notification" WHERE "userId" = $1 AND "isRead" = false',
      [session.userId]
    )
    const unreadCount = countRes.rows[0]?.count || 0

    return NextResponse.json({
      notifications: result.rows,
      unreadCount,
      limit,
    })
  } catch (error: any) {
    console.error('Notifications GET error:', error?.message)
    return NextResponse.json({ notifications: [], unreadCount: 0, error: 'Failed to load' }, { status: 500 })
  }
}

// POST: Mark all as read
export async function POST(req: NextRequest) {
  try {
    const session = await requireTenant(req)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await pool.query(
      'UPDATE "Notification" SET "isRead" = true WHERE "userId" = $1 AND "isRead" = false',
      [session.userId]
    )

    return NextResponse.json({ success: true, unreadCount: 0 })
  } catch (error: any) {
    console.error('Notifications POST error:', error?.message)
    return NextResponse.json({ error: 'Failed to mark read' }, { status: 500 })
  }
}

// DELETE: Clear all notifications
export async function DELETE(req: NextRequest) {
  try {
    const session = await requireTenant(req)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await pool.query(
      'DELETE FROM "Notification" WHERE "userId" = $1',
      [session.userId]
    )

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Notifications DELETE error:', error?.message)
    return NextResponse.json({ error: 'Failed to clear' }, { status: 500 })
  }
}