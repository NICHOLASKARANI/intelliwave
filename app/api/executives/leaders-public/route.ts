export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'

export async function GET() {
  try {
    const res = await pool.query(`
      SELECT id, full_name, location, level, total_active_users, referral_code
      FROM "ExecutiveLeader"
      WHERE status = 'APPROVED' AND level > 0
      ORDER BY level DESC, total_active_users DESC
      LIMIT 50
    `)
    return NextResponse.json({ leaders: res.rows })
  } catch {
    return NextResponse.json({ leaders: [] })
  }
}