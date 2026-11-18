export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await pool.query(
      `DELETE FROM "Notification"
       WHERE id = $1 AND ("userId" = $2 OR "organizationId" = $3)`,
      [params.id, session.userId, session.organizationId]
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[notifications/:id DELETE] error:', error)
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
  }
}