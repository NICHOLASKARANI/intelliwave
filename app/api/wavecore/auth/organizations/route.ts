export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { getSessionFromRequest } from '@/lib/wavecore/auth'
import { getSession } from '@/lib/wavecore/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request)
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const result = await pool.query(
      `SELECT o.id, o.name, o."isActive",
              CASE WHEN o.id = $2 THEN true ELSE false END as is_current
       FROM "_OrganizationMembers" om
       JOIN "Organization" o ON o.id = om."A"
       WHERE om."B" = $1
       ORDER BY is_current DESC, o.name ASC`,
      [session!.userId, session!.organizationId]
    )

    return NextResponse.json({ organizations: result.rows })
  } catch (error) {
    console.error('Organizations error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}