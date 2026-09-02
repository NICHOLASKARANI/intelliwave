export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/wavecore/auth'
import { pool } from '@/lib/wavecore/db'

export async function DELETE(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Delete all demo warehouses
    await pool.query(`DELETE FROM "Warehouse" WHERE name ILIKE '%demo%' OR name ILIKE '%geryeruyrth%' OR name ILIKE '%rey54%'`)

    return NextResponse.json({ success: true, message: 'Demo warehouses deleted' })
  } catch (error) {
    console.error('Delete demo error:', error)
    return NextResponse.json({ error: 'Failed to delete demo warehouses' }, { status: 500 })
  }
}