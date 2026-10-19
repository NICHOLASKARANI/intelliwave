export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '50')
    const offset = (page - 1) * pageSize

    // Tenant-scoped: only this org's logs, and only entries that belong
    // to the current user (existing behavior preserved via userId check).
    const result = await pool.query(
      `SELECT al.id, al.action, al."entityType", al."entityId", al."createdAt",
              u.name as user_name, u.email as user_email
       FROM "AuditLog" al
       LEFT JOIN "User" u ON u.id = al."userId"
       WHERE al."organizationId" = $1 AND al."userId" = $2
       ORDER BY al."createdAt" DESC
       LIMIT $3 OFFSET $4`,
      [session.organizationId, session.userId, pageSize, offset]
    )

    const countResult = await pool.query(
      'SELECT COUNT(*) FROM "AuditLog" WHERE "organizationId" = $1 AND "userId" = $2',
      [session.organizationId, session.userId]
    )

    return NextResponse.json({
      auditLogs: result.rows,
      pagination: {
        page, pageSize,
        total: parseInt(countResult.rows[0].count),
        totalPages: Math.ceil(parseInt(countResult.rows[0].count) / pageSize),
      },
    })
  } catch (error) {
    console.error('AuditLogs GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}