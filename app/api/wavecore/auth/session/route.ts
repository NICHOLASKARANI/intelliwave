import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'

export async function GET(req: NextRequest) {
  try {
    const sessionToken = req.cookies.get('wavecore_session')?.value

    if (!sessionToken) {
      return NextResponse.json({ authenticated: false }, { status: 401 })
    }

    const result = await pool.query(
      `SELECT s."userId", s.expires,
              u.name, u.email, u.role, u."isActive",
              o.id as org_id, o.name as org_name, o."isActive" as org_active
       FROM "Session" s
       JOIN "User" u ON u.id = s."userId"
       JOIN "Organization" o ON o.id = u."organizationId"
       WHERE s."sessionToken" = $1 AND s.expires > NOW()
       LIMIT 1`,
      [sessionToken]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ authenticated: false }, { status: 401 })
    }

    const row = result.rows[0]

    // Check subscription
    const subResult = await pool.query(
      `SELECT * FROM "Subscription" WHERE "organizationId" = $1 AND status = 'ACTIVE' AND "endDate" > NOW() LIMIT 1`,
      [row.org_id]
    )

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
      subscribed: subResult.rows.length > 0,
    })
  } catch (error) {
    return NextResponse.json({ authenticated: false }, { status: 500 })
  }
}