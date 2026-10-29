import { NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { sendEmail } from '@/lib/wavecore/email'

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Find all approved leaders who are owed money
  const leaders = await pool.query(`
    SELECT l.full_name, l.email, l.level,
      (SELECT COALESCE(SUM(amount), 0) FROM "ExecutivePayout" p WHERE p.leader_id = l.id AND p.status = 'PENDING') AS pending_amount
    FROM "ExecutiveLeader" l
    WHERE l.status = 'APPROVED' AND l.level > 0
  `)

  // Notify CEO
  await sendEmail({
    to: process.env.SMTP_USER || 'intelliwavehr@gmail.com',
    subject: `Monthly Payouts Ready — ${leaders.rows.length} leaders`,
    text: `Time to review and approve monthly payouts. ${leaders.rows.length} leaders reached Level 1+.`,
    html: `<h1>Monthly Payouts</h1><p>${leaders.rows.length} leaders are awaiting payment.</p>`
  })

  return NextResponse.json({ success: true, notified: leaders.rows.length })
}