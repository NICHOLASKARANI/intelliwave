export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireTenant()
    const orgId = session.organizationId

    await pool.query('DELETE FROM "JournalItem" WHERE "journalEntryId" = $1', [params.id])
    const result = await pool.query(
      'DELETE FROM "JournalEntry" WHERE id = $1 AND "organizationId" = $2',
      [params.id, orgId]
    )

    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}