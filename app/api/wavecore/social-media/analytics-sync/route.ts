export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/wavecore/auth'
import { pool } from '@/lib/wavecore/db'

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const integrations = await pool.query(
      `SELECT * FROM "SocialIntegration" WHERE "organizationId" = $1 AND status = 'CONNECTED'`,
      [session.organizationId]
    )

    return NextResponse.json({ 
      success: true, 
      analytics: integrations.rows.map(i => ({
        platform: i.platform,
        status: 'AVAILABLE',
        followers: 0,
        reach: 0,
        engagement: 0
      }))
    })
  } catch (error) {
    return NextResponse.json({ analytics: [] })
  }
}