export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'

export async function GET(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('wavecore_session')?.value

    if (!sessionToken) {
      return NextResponse.json({ authenticated: false }, { status: 401 })
    }

    const result = await pool.query(
      `SELECT s."userId", u.name, u.email, u.role,
              o.id as org_id, o.name as org_name
       FROM "Session" s
       JOIN "User" u ON u.id = s."userId"
       JOIN "_OrganizationMembers" om ON om."B" = u.id
       JOIN "Organization" o ON o.id = om."A"
       WHERE s."sessionToken" = $1
       LIMIT 1`,
      [sessionToken]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ authenticated: false }, { status: 401 })
    }

    const row = result.rows[0]

    return NextResponse.json({
      authenticated: true,
      user: {
        id: row.userId,
        name: row.name,
        email: row.email,
        role: row.role,
      },
      organization: {
        id: row.org_id,
        name: row.org_name,
      },
      permissions: [],
    })
  } catch (error: any) {
    console.error('Session API error:', error.message)
    return NextResponse.json({ authenticated: false }, { status: 500 })
  }
}