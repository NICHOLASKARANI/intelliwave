export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '50')
    const offset = (page - 1) * pageSize

    const result = await pool.query(
      `SELECT al.id, al.action, al."entityType", al."entityId", al."createdAt",
              u.name as user_name, u.email as user_email
       FROM "AuditLog" al
       LEFT JOIN "User" u ON u.id = al."userId"
       WHERE al."userId" = $1
       ORDER BY al."createdAt" DESC
       LIMIT $2 OFFSET $3`,
      [session!.userId, pageSize, offset]
    )

    const countResult = await pool.query(
      'SELECT COUNT(*) FROM "AuditLog" WHERE "userId" = $1',
      [session!.userId]
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