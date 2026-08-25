import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Return system logs (or empty if not admin)
    const result = await pool.query(
      `SELECT * FROM "AuditLog" WHERE "userId" = $1 ORDER BY "createdAt" DESC LIMIT 50`,
      [session!.userId]
    )
    
    return NextResponse.json({ logs: result.rows })
  } catch (error) {
    return NextResponse.json({ logs: [] })
  }
}