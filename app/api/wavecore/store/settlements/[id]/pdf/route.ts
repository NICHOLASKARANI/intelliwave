export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/wavecore/auth'
import { pool } from '@/lib/wavecore/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const result = await pool.query(
      `SELECT * FROM "Settlement" WHERE id = $1 AND "organizationId" = $2`,
      [params.id, session.organizationId]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Settlement not found' }, { status: 404 })
    }

    const settlement = result.rows[0]

    const html = `<!DOCTYPE html><html><head><title>Settlement ${settlement.number}</title>
<style>body{font-family:Arial;padding:40px;max-width:600px;margin:0 auto}.header{text-align:center;border-bottom:3px solid #7c3aed;padding-bottom:20px}.company{font-size:24px;font-weight:bold;color:#7c3aed}.amount{text-align:center;font-size:32px;font-weight:bold;color:#16a34a;margin:20px 0}.field{display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid #e5e7eb}.label{font-weight:bold;color:#6b7280}.value{font-weight:bold;color:#111827}</style></head>
<body><div class="header"><div class="company">IntelliWavve</div><div>SETTLEMENT RECEIPT</div></div>
<div class="amount">KSh ${Number(settlement.amount || 0).toLocaleString()}</div>
<div class="field"><span class="label">Settlement #</span><span class="value">${settlement.number}</span></div>
<div class="field"><span class="label">Customer</span><span class="value">${settlement.customerName || 'N/A'}</span></div>
<div class="field"><span class="label">Method</span><span class="value">${settlement.method || 'N/A'}</span></div>
<div class="field"><span class="label">Status</span><span class="value">${settlement.status || 'PENDING'}</span></div>
<div class="field"><span class="label">Date</span><span class="value">${new Date(settlement.createdAt).toLocaleString('en-KE')}</span></div>
<script>window.print();</script></body></html>`

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `inline; filename="settlement-${settlement.number}.html"`
      }
    })
  } catch (error) {
    return NextResponse.json({ error: 'PDF failed' }, { status: 500 })
  }
}