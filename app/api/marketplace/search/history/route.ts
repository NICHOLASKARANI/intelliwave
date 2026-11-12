export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

export async function GET(req: NextRequest) {
  try {
    const session = await requireTenant(req)
    if (!session) return NextResponse.json({ history: [] })

    const res = await pool.query(
      `SELECT DISTINCT ON (LOWER(query)) query, "resultCount", "createdAt"
       FROM "SearchHistory"
       WHERE "userId" = $1
       ORDER BY LOWER(query), "createdAt" DESC
       LIMIT 20`,
      [session.userId]
    )

    const sorted = res.rows.sort((a: any, b: any) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )

    return NextResponse.json({ history: sorted })
  } catch (error: any) {
    console.error('History error:', error?.message)
    return NextResponse.json({ history: [] })
  }
}

// DELETE: clear history
export async function DELETE(req: NextRequest) {
  try {
    const session = await requireTenant(req)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await pool.query(`DELETE FROM "SearchHistory" WHERE "userId" = $1`, [session.userId])
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('History DELETE error:', error?.message)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}