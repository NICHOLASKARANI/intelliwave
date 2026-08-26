export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const [empResult, attResult] = await Promise.all([
      pool.query(`SELECT COUNT(*) as count FROM "Employee" WHERE "organizationId" = $1`, [session.organizationId]),
      pool.query(`SELECT COUNT(*) as count FROM "Attendance" WHERE "organizationId" = $1`, [session.organizationId])
    ])

    return NextResponse.json({
      summary: {
        totalEmployees: parseInt(empResult.rows[0]?.count || '0'),
        totalAttendance: parseInt(attResult.rows[0]?.count || '0')
      }
    })
  } catch (error) {
    console.error('HR Summary error:', error)
    return NextResponse.json({ summary: {} })
  }
}