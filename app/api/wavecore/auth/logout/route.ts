export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { // destroySession, getSession } from '@/lib/wavecore/auth'
import { pool } from '@/lib/wavecore/db'

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()

    if (session) {
      await pool.query(
        `INSERT INTO "AuditLog" (id, action, "entityType", "entityId", "userId", "createdAt")
         VALUES (gen_random_uuid()::text, $1, $2, $3, $4, NOW())`,
        ['LOGOUT', 'User', session.userId, session.userId]
      )
    }

    await // destroySession()

    return NextResponse.json({ success: true, message: 'Logged out successfully' })
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json({ error: 'Unable to log out' }, { status: 500 })
  }
}