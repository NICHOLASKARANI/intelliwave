export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

// POST: Mark a single notification as read
// Multi-tenant safe: requires BOTH notification id AND session.userId to match
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireTenant(req)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = params
    if (!id || typeof id !== 'string') {
      return NextResponse.json({ error: 'id required' }, { status: 400 })
    }

    // Double-scoped update:
    //  - id must match the notification
    //  - userId must match the logged-in user (prevents cross-tenant access)
    //  - isRead = false only (idempotent — already-read returns rowCount 0)
    const result = await pool.query(
      'UPDATE "Notification" SET "isRead" = true WHERE id = $1 AND "userId" = $2 AND "isRead" = false',
      [id, session.userId]
    )

    // Return 200 uniformly so an attacker can't distinguish:
    //  - id exists but belongs to someone else
    //  - id doesn't exist
    //  - id already read
    return NextResponse.json({ success: true, updated: result.rowCount || 0 })
  } catch (error: any) {
    console.error('Notification mark-one-read error:', error?.message)
    return NextResponse.json({ error: 'Failed to mark read' }, { status: 500 })
  }
}