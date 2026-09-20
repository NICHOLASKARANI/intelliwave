export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'
import { guardHR } from '@/lib/wavecore/guard'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const guard = await guardHR(request, 'HR_EXPORT')
    if (guard.deny) return guard.response!

    const orgId = session.organizationId

    const tRes = await pool.query(
      `SELECT * FROM "SupportTicket" WHERE id = $1 AND "organizationId" = $2`,
      [params.id, orgId]
    )
    if (tRes.rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    const t = tRes.rows[0]

    const cRes = await pool.query(
      `SELECT * FROM "TicketComment" WHERE "ticketId" = $1 AND "organizationId" = $2 AND "isInternal" = false ORDER BY "createdAt" ASC LIMIT 200`,
      [params.id, orgId]
    )
    const comments = cRes.rows

    const statusColor = (s: string) =>
      s === 'OPEN' ? '#0891b2' :
      s === 'IN_PROGRESS' ? '#ca8a04' :
      s === 'PENDING' ? '#ea580c' :
      s === 'RESOLVED' ? '#16a34a' :
      s === 'CLOSED' ? '#6b7280' :
      '#6b7280'

    const priorityColor = (p: string) =>
      p === 'URGENT' ? '#dc2626' :
      p === 'HIGH' ? '#ea580c' :
      p === 'MEDIUM' ? '#0891b2' :
      '#6b7280'

    const commentRows = comments.map((c, i) => `
      <div style="padding:12px;border-left:3px solid #db2777;background:#fdf2f8;border-radius:6px;margin-bottom:8px">
        <div style="display:flex;justify-content:space-between;margin-bottom:4px">
          <span style="font-size:11px;font-weight:700;color:#db2777">${c.authorName || 'User'}</span>
          <span style="font-size:10px;color:#6b7280">${new Date(c.createdAt).toLocaleString('en-GB')}</span>
        </div>
        <p style="font-size:11px;color:#374151;margin:0;white-space:pre-wrap">${c.body}</p>
      </div>`).join('')

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
<title>Ticket ${t.subject}</title>
<style>
  @page { size: A4 portrait; margin: 15mm; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #111827; margin: 0; }
  .hdr { display: flex; justify-content: space-between; border-bottom: 4px solid #db2777; padding-bottom: 16px; margin-bottom: 20px; }
  .brand { font-size: 26px; font-weight: 800; color: #db2777; }
  .brand-sub { font-size: 11px; color: #6b7280; margin-top: 2px; }
  .doc-title h1 { font-size: 18px; margin: 0; }
  .doc-title .num { font-family: 'Courier New', monospace; font-size: 11px; color: #db2777; margin-top: 4px; font-weight: 700; }
  .section-title { font-size: 12px; font-weight: 800; color: #db2777; text-transform: uppercase; letter-spacing: 0.6px; margin: 18px 0 10px; padding-bottom: 4px; border-bottom: 2px solid #fce7f3; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px; }
  .field { padding: 8px 10px; border: 1px solid #e5e7eb; border-radius: 6px; }
  .field-label { font-size: 9px; text-transform: uppercase; color: #6b7280; letter-spacing: 0.5px; font-weight: 700; }
  .field-value { font-size: 12px; color: #111827; margin-top: 2px; font-weight: 600; }
  .body-box { padding: 14px; border: 1px solid #e5e7eb; border-radius: 8px; background: #f9fafb; }
  .body-text { font-size: 12px; color: #374151; line-height: 1.5; white-space: pre-wrap; margin: 0; }
  .footer { margin-top: 30px; text-align: center; color: #9ca3af; font-size: 10px; border-top: 1px solid #e5e7eb; padding-top: 12px; }
</style></head><body>

<div class="hdr">
  <div><div class="brand">WaveCore ERP</div><div class="brand-sub">Helpdesk · Ticket Detail</div></div>
  <div class="doc-title"><h1>SUPPORT TICKET</h1><div class="num">${t.id.slice(0, 8).toUpperCase()}</div></div>
</div>

<div class="grid">
  <div class="field"><div class="field-label">Status</div><div class="field-value" style="color:${statusColor(t.status)}">${t.status}</div></div>
  <div class="field"><div class="field-label">Priority</div><div class="field-value" style="color:${priorityColor(t.priority)}">${t.priority}</div></div>
  <div class="field"><div class="field-label">Category</div><div class="field-value">${t.category || 'GENERAL'}</div></div>
  <div class="field"><div class="field-label">Assignee</div><div class="field-value">${t.assigneeName || 'Unassigned'}</div></div>
  <div class="field"><div class="field-label">Customer Name</div><div class="field-value">${t.customerName || '—'}</div></div>
  <div class="field"><div class="field-label">Customer Email</div><div class="field-value">${t.customerEmail || '—'}</div></div>
  <div class="field"><div class="field-label">Created</div><div class="field-value">${new Date(t.createdAt).toLocaleString('en-GB')}</div></div>
  <div class="field"><div class="field-label">SLA Due</div><div class="field-value">${t.dueAt ? new Date(t.dueAt).toLocaleString('en-GB') : '—'}</div></div>
</div>

<div class="section-title">Subject</div>
<div class="body-box"><p class="body-text">${t.subject}</p></div>

<div class="section-title">Description</div>
<div class="body-box"><p class="body-text">${t.description || 'No description provided.'}</p></div>

${comments.length > 0 ? `
<div class="section-title">Conversation (${comments.length})</div>
${commentRows}
` : ''}

<div class="footer"><p>Generated by WaveCore ERP · © ${new Date().getFullYear()} IntelliWavve</p></div>

<script>window.onload = function(){ setTimeout(function(){ window.print(); }, 400); };</script>
</body></html>`

    return new NextResponse(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
  } catch (error) {
    console.error('Ticket detail PDF error:', error)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}