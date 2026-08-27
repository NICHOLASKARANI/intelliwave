export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/wavecore/auth'
import { pool } from '@/lib/wavecore/db'
import { INTEGRATION_STATES } from '@/lib/wavecore/social-capabilities'

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const result = await pool.query(
      `SELECT id, platform, "accountName", "accountId", "profileImage", status, "connectedAt", "lastCheckedAt"
       FROM "SocialIntegration" WHERE "organizationId" = $1 ORDER BY "connectedAt" DESC`,
      [session.organizationId]
    )

    return NextResponse.json({ integrations: result.rows })
  } catch (error) {
    return NextResponse.json({ integrations: [] })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    await pool.query(
      `DELETE FROM "SocialIntegration" WHERE id = $1 AND "organizationId" = $2`,
      [id, session.organizationId]
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Disconnect failed' }, { status: 500 })
  }
}