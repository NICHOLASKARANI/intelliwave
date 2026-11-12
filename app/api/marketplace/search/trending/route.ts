export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'

// GET: top 20 queries from last 7 days (public, no auth)
export async function GET(req: NextRequest) {
  try {
    const res = await pool.query(
      `SELECT query, COUNT(*)::int AS "count"
       FROM "SearchHistory"
       WHERE "createdAt" > NOW() - INTERVAL '7 days'
         AND LENGTH(query) >= 3
       GROUP BY query
       ORDER BY COUNT(*) DESC
       LIMIT 20`
    )
    return NextResponse.json({ trending: res.rows })
  } catch (error: any) {
    console.error('Trending error:', error?.message)
    return NextResponse.json({ trending: [] })
  }
}