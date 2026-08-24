export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

// GET: List audit logs
export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const result = await pool.query(
      `SELECT * FROM "AuditLog" WHERE "organizationId" = $1 ORDER BY "createdAt" DESC LIMIT 100`,
      [session.organizationId]
    )

    return NextResponse.json({ logs: result.rows })
  } catch (error) {
    console.error('Audit GET error:', error)
    return NextResponse.json({ logs: [] })
  }
}