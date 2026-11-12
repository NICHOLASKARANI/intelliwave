export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

export async function GET(req: NextRequest) {
  try {
    const session = await requireTenant(req)
    if (!session) return NextResponse.json({ blocked: [] })

    const res = await pool.query(
      `SELECT b.id, b."blockedId", b.reason, b."createdAt", u.name AS "blockedName"
       FROM "MarketplaceUserBlock" b
       LEFT JOIN "User" u ON u.id = b."blockedId"
       WHERE b."blockerId" = $1
       ORDER BY b."createdAt" DESC`,
      [session.userId]
    )

    return NextResponse.json({ blocked: res.rows })
  } catch (error: any) {
    console.error('Blocked list error:', error?.message)
    return NextResponse.json({ blocked: [] })
  }
}