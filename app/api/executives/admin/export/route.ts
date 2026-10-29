export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'

export async function GET(req: NextRequest) {
  const pw = req.headers.get('x-ceo-password')
  if (pw !== process.env.SHOP_ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const res = await pool.query(`
      SELECT 
        l.full_name, l.email, l.phone, l.status, l.level,
        l.referral_code, l.total_active_users,
        (SELECT COUNT(*) FROM "ExecutiveCustomer" c WHERE c.leader_id = l.id AND c.is_paying = TRUE) AS paying_users,
        (SELECT COALESCE(SUM(amount), 0) FROM "ExecutivePayout" p WHERE p.leader_id = l.id AND p.status = 'APPROVED') AS paid_out,
        CASE 
          WHEN l.level = 1 THEN 3000
          WHEN l.level = 2 THEN 8000
          WHEN l.level = 3 THEN 20000
          ELSE 0
        END AS monthly_reward
      FROM "ExecutiveLeader" l
      ORDER BY l.level DESC, l.total_active_users DESC
    `)

    const headers = ['Full Name', 'Email', 'Phone', 'Status', 'Level', 'Referral Code', 'Active Users', 'Monthly Reward (KSh)', 'Paid Out (KSh)']
    const rows = res.rows.map(r => [
      r.full_name, r.email, r.phone, r.status, r.level,
      r.referral_code, r.total_active_users,
      r.monthly_reward, r.paid_out
    ])

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
    ].join('\n')

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="intelliwavve-leaders-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    })
  } catch (error) {
    console.error('[executives export]', error)
    return NextResponse.json({ error: 'Export failed' }, { status: 500 })
  }
}