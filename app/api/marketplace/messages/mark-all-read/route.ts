export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

// POST: mark all messages as read for current user
export async function POST(req: NextRequest) {
  try {
    const session = await requireTenant(req)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await pool.query(
      `UPDATE "MarketplaceMessage" SET "isRead" = true WHERE "receiverId" = $1 AND "isRead" = false`,
      [session.userId]
    )
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Mark all read error:', error?.message)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}