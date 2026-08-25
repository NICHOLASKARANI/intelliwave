export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const result = await pool.query(
      `SELECT * FROM "WorkOrder" WHERE "organizationId" = $1 ORDER BY "createdAt" DESC LIMIT 50`,
      [session.organizationId]
    )

    return NextResponse.json({ workOrders: result.rows })
  } catch (error) {
    console.error('Manufacturing GET error:', error)
    return NextResponse.json({ workOrders: [] })
  }
}