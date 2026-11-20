export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'
import { writeAuditAsync } from '@/lib/wavecore/audit'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const result = await pool.query(
      `DELETE FROM "CommunicationLog" WHERE id = $1 AND "organizationId" = $2`,
      [params.id, session.organizationId]
    )
    if (result.rowCount && result.rowCount > 0) {
      await writeAuditAsync({
        organizationId: session.organizationId,
        userId: session.userId,
        action: 'DELETE',
        entityType: 'CommunicationLog',
        entityId: params.id,
      })
    }
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[crm/communications/[id] DELETE]', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}