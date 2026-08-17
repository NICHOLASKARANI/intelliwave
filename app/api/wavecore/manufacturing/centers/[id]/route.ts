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
    const tableName = request.url.includes('work-orders') ? 'WorkOrder' :
      request.url.includes('bom') ? 'BillOfMaterial' :
      request.url.includes('quality') ? 'QualityCheck' :
      request.url.includes('centers') ? 'WorkCenter' : 'MaintenanceRequest'

    const result = await pool.query(
      `DELETE FROM "${tableName}" WHERE id = $1 AND "organizationId" = $2`,
      [params.id, session.organizationId]
    )

    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('DELETE error:', error.message)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}