export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const result = await pool.query(
      'DELETE FROM "Project" WHERE "id" = $1',
      [params.id]
    )
    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Project DELETE:', error.message)
    return NextResponse.json({ error: 'Failed: ' + error.message }, { status: 500 })
  }
}