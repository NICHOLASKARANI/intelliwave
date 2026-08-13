export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant()

    const result = await pool.query(
      `SELECT u.id, u.name, u.email, u.role, u."isActive", u."createdAt",
              o.name as org_name
       FROM "User" u
       JOIN "_OrganizationMembers" om ON om."B" = u.id
       JOIN "Organization" o ON o.id = om."A"
       WHERE o.id = $1
       ORDER BY u."createdAt" DESC`,
      [session.organizationId]
    )

    return NextResponse.json({ users: result.rows })
  } catch (error) {
    console.error('Users GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}