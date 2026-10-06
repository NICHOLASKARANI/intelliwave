export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/wavecore/auth'
import { pool } from '@/lib/wavecore/db'

function esc(s: any): string {
  return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!))
}
function dateFmt(d: any): string {
  if (!d) return '—'
  try { return new Date(d).toLocaleDateString('en-GB') } catch { return '—' }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const aRes = await pool.query(
      `SELECT a.*,
              c.name AS "customerName", c.email AS "customerEmail",
              l.name AS "leadName", l.email AS "leadEmail",
              o.name AS "opportunityName",
              u.name AS "ownerName", u.email AS "ownerEmail"
       FROM "Activity" a
       LEFT JOIN "Customer" c    ON c.id = a."customerId"
       LEFT JOIN "Lead" l        ON l.id = a."leadId"
       LEFT JOIN "Opportunity" o ON o.id = a."opportunityId"
       LEFT JOIN "User" u        ON u.id = a."assignedToId"
       WHERE a.id = $1 AND a."organizationId" = $2`,
      [params.id, session.organizationId]
    )
    if (aRes.rowCount === 0) return NextResponse.json({ error: 'Activity not found' }, { status: 404 })
    const activity = aRes.rows[0]

    // Relationship block — whichever of customer/lead/opportunity is set
    const relLines: string[] = []
    if (activity.customerName)    relLines.push(`Customer: <strong>${esc(activity.customerName)}</strong>${activity.customerEmail ? ' — ' + esc(activity.customerEmail) : ''}`)
    if (activity.leadName)        relLines.push(`Lead: <strong>${esc(activity.leadName)}</strong>${activity.leadEmail ? ' — ' + esc(activity.leadEmail) : ''}`)
    if (activity.opportunityName) relLines.push(`Opportunity: <strong>${esc(activity.opportunityName)}</strong>`)
    if (relLines.length === 0)    relLines.push('Not linked to a customer, lead or opportunity.')

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Activity — ${esc(activity.subject || activity.type)}</title>
  <style>
    body { font-family: Arial, Helvetica, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; color: #111827; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #2563eb; padding-bottom: 20px; margin-bottom: 24px; }
    .company { font-size: 26px; font-weight: bold; color: #2563eb; }
    .subtitle { font-size: 13px; color: #6b7280; margin-top: 4px; }
    .doc-meta { text-align: right; font-size: 13px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px; }
    .card { background: #f9fafb; border-radius: 12px; padding: 18px; }
    .card h3 { margin: 0 0 10px 0; font-size: 12px; text-transform: uppercase; color: #6b7280; letter-spacing: .05em; }
    .card p { margin: 4px 0; font-size: 14px; }
    .body-block { background: #eff6ff; border-left: 4px solid #2563eb; padding: 14px; border-radius: 6px; font-size: 14px; margin-bottom: 24px; white-space: pre-wrap; }
    .status-chip { display: inline-block; padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: bold; }
    .status-done { background: #d1fae5; color: #065f46; }
    .status-open { background: #fee2e2; color: #991b1b; }
    .footer { margin-top: 40px; text-align: center; font-size: 11px; color: #6b7280; border-top: 1px solid #e5e7eb; padding-top: 16px; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="company">IntelliWavve</div>
      <div class="subtitle">Activity Record</div>
    </div>
    <div class="doc-meta">
      <p><strong>${esc(activity.subject || activity.type)}</strong></p>
      <p>Type: ${esc(activity.type || '—')}</p>
      <p>Logged: ${dateFmt(activity.createdAt)}</p>
      <p><span class="status-chip ${activity.completed ? 'status-done' : 'status-open'}">${activity.completed ? 'Completed' : 'Open'}</span></p>
    </div>
  </div>

  <div class="grid">
    <div class="card">
      <h3>Scheduling</h3>
      <p>Due date: <strong>${dateFmt(activity.dueDate)}</strong></p>
      <p>Completed: <strong>${activity.completed ? 'Yes' : 'No'}</strong></p>
      <p>Logged: ${dateFmt(activity.createdAt)}</p>
    </div>
    <div class="card">
      <h3>Assigned to</h3>
      <p><strong>${esc(activity.ownerName || 'Unassigned')}</strong></p>
      ${activity.ownerEmail ? `<p>${esc(activity.ownerEmail)}</p>` : ''}
    </div>
  </div>

  <div class="card" style="margin-bottom:24px;">
    <h3>Related record</h3>
    ${relLines.map(l => `<p>${l}</p>`).join('')}
  </div>

  ${activity.description ? `<div class="body-block"><strong>Description:</strong><br>${esc(activity.description)}</div>` : ''}

  <div class="footer">
    System-generated activity record from IntelliWavve ERP.<br>
    Generated ${new Date().toLocaleString('en-KE')}
  </div>

  <script>window.print();</script>
</body>
</html>`

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `inline; filename="activity-${(activity.subject || activity.type || activity.id).substring(0, 40)}.html"`,
      },
    })
  } catch (error) {
    console.error('[activity pdf]', error)
    return NextResponse.json({ error: 'PDF failed: ' + (error as Error).message }, { status: 500 })
  }
}