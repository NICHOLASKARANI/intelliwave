export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getRecentLogs } from '@/lib/wavecore/logger'
import { requireTenant } from '@/lib/wavecore/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant()

    // Only allow OWNER or ADMIN to view logs
    if (session.role !== 'OWNER' && session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200)

    const logs = getRecentLogs(limit).filter(log => 
      log.organizationId === session.organizationId || !log.organizationId
    )

    return NextResponse.json({ logs })
  } catch (error) {
    console.error('Logs error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}