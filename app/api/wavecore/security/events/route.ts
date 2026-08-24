export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { getSessionFromRequest } from '@/lib/wavecore/auth'

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const result = await pool.query(
      `SELECT * FROM "SecurityEvent" ORDER BY "createdAt" DESC LIMIT 200`
    )

    return NextResponse.json({ events: result.rows })
  } catch (error) {
    console.error('Security events error:', error)
    return NextResponse.json({ events: [] })
  }
}