export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'
import { guardHR } from '@/lib/wavecore/guard'

function esc(s: any): string {
  return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!))
}
function fmtDate(d: any): string {
  if (!d) return '—'
  try { return new Date(d).toLocaleString('en-GB') } catch { return '—' }
}

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

    const safe = async (q: string, p: any[]) => {
      try { return (await pool.query(q, p)).rows } catch { return [] }
    }
    const [comments, attachments] = await Promise.all([
      safe(`SELECT * FROM "TicketComment" WHERE "ticketId" = $1 AND "organizationId" = $2 ORDER BY "createdAt" ASC LIMIT 500`, [params.id, orgId]),
      safe(`SELECT * FROM "TicketAttachment" WHERE "ticketId" = $1 AND "organizationId" = $2 ORDER BY "createdAt" ASC LIMIT 200`, [params.id, orgId]),
    ])

    const now = new Date()
    const dueAt = t.dueAt ? new Date(t.dueAt) : null
    const resolvedAt = t.resolvedAt ? new Date(t.resolvedAt) : null
    const closedAt = t.closedAt ? new Date(t.closedAt) : null
    const firstResp = t.firstResponseAt ? new Date(t.firstResponseAt) : null
    const isClosed = t.status === 'RESOLVED' || t.status === 'CLOSED'
    const isOverdue = !isClosed && dueAt && dueAt < now
    const ageMs = now.getTime() - new Date(t.createdAt).getTime()
    const ageDays = Math.floor(ageMs / 86400000)
    const ageHours = Math.floor((ageMs % 86400000) / 3600000)

    // Time-to-first-response
    const ttfr = firstResp ? Math.floor((firstResp.getTime() - new Date(t.createdAt).getTime()) / 60000) : null
    // Time-to-resolution
    const ttr = resolvedAt ? Math.floor((resolvedAt.getTime() - new Date(t.createdAt).getTime()) / 60000) : null

    const statusColor = (s: string) =>
      s === 'OPEN' ? '#0891b2' :
      s === 'IN_PROGRESS' ? '#ca8a04' :
      s === 'PENDING' ? '#ea580c' :
      s === 'RESOLVED' ? '#16a34a' :
      s === 'CLOSED' ? '#6b7280' : '#6b7280'
    const priorityColor = (p: string) =>
      p === 'URGENT' ? '#dc2626' :
      p === 'HIGH' ? '#ea580c' :
      p === 'MEDIUM' ? '#0891b2' : '#6b7280'

    const commentsHtml = comments.length === 0
      ? '<p style="font-size:11px;color:#9ca3af;text-align:center;padding:12px">No comments recorded.</p>'
      : comments.map((c: any) => `
        <div style="padding:12px;border-left:3px solid #db2777;background:#fdf2f8;border-radius:6px;margin-bottom:8px">
          <div style="display:flex;justify-content:space-between;margin-bottom:4px">
            <span style="font-size:11px;font-weight:700;color:#db2777">${esc(c.authorName || 'User')}</span>
            <span style="font-size:10px;color:#6b7280">${fmtDate(c.createdAt)}${c.isInternal ? ' · internal' : ''}</span>
          </div>
          <p style="font-size:11px;color:#374151;margin:0;white-space:pre-wrap">${esc(c.body)}</p>
        </div>`).join('')

    const attachmentsHtml = attachments.length === 0
      ? '<p style="font-size:11px;color:#9ca3af;text-align:center;padding:12px">No attachments.</p>'
      : `<ul style="margin:0;padding-left:18px;font-size:11px">${attachments.map((a: any) => `
          <li style="padding:3px 0">
            <span style="font-weight:700">${esc(a.fileName || a.name || 'attachment')}</span>
            ${a.fileSize ? ' · ' + (Number(a.fileSize) / 1024).toFixed(1) + ' KB' : ''}
            ${a.mimeType ? ' · ' + esc(a.mimeType) : ''}
            ${a.uploadedAt || a.createdAt ? ' · ' + fmtDate(a.uploadedAt || a.createdAt) : ''}
          </li>`).join('')}</ul>`

    const tags = (() => {
      if (!t.tags) return null
      try {
        const arr = typeof t.tags === 'string' ? JSON.parse(t.tags) : t.tags
        return Array.isArray(arr) ? arr : [String(t.tags)]
      } catch { return [String(t.tags)] }
    })()

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
<title>Ticket ${esc(t.subject)}</title>
<style>
  @page { size: A4 portrait; margin: 15mm; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #111827; margin: 0; }
  .hdr { display: flex; justify-content: space-between; border-bottom: 4px solid #db2777; padding-bottom: 16px; margin-bottom: 20px; }
  .brand { font-size: 26px; font-weight: 800; color: #db2777; }
  .brand-sub { font-size: 11px; color: #6b7280; margin-top: 2px; }
  .doc-title h1 { font-size: 18px; margin: 0; }
  .doc-title .num { font-family: 'Courier New', monospace; font-size: 11px; color: #db2777; margin-top: 4px; font-weight: 700; }
  .section-title { font-size: 12px; font-weight: 800; color: #db2777; text-transform: uppercase; letter-spacing: 0.6px; margin: 20px 0 10px; padding-bottom: 4px; border-bottom: 2px solid #fce7f3; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 16px; }
  .field { padding: 8px 10px; border: 1px solid #e5e7eb; border-radius: 6px; }
  .field-label { font-size: 9px; text-transform: uppercase; color: #6b7280; letter-spacing: 0.5px; font-weight: 700; }
  .field-value { font-size: 12px; color: #111827; margin-top: 2px; font-weight: 600; word-break: break-word; }
  .body-box { padding: 14px; border: 1px solid #e5e7eb; border-radius: 8px; background: #f9fafb; }
  .body-text { font-size: 12px; color: #374151; line-height: 1.5; white-space: pre-wrap; margin: 0; }
  .alert { padding:10px 12px;border-radius:8px;font-size:11px;font-weight:700;margin-bottom:14px; }
  .alert-overdue { background:#fef2f2;color:#dc2626;border:1px solid #fecaca; }
  .tags { display:flex;flex-wrap:wrap;gap:6px; }
  .tag { padding:3px 8px;border-radius:8px;background:#fce7f3;color:#be185d;font-size:10px;font-weight:700; }
  .footer { margin-top: 30px; text-align: center; color: #9ca3af; font-size: 10px; border-top: 1px solid #e5e7eb; padding-top: 12px; }
</style></head><body>

<div class="hdr">
  <div><div class="brand">WaveCore ERP</div><div class="brand-sub">Helpdesk · Ticket Detail</div></div>
  <div class="doc-title"><h1>SUPPORT TICKET</h1><div class="num">${esc((t.id || '').slice(0, 8).toUpperCase())}</div></div>
</div>

${isOverdue ? '<div class="alert alert-overdue">⚠ SLA BREACHED — past due ' + fmtDate(dueAt) + '</div>' : ''}

<div class="section-title">Summary</div>
<div class="grid">
  <div class="field"><div class="field-label">Status</div><div class="field-value" style="color:${statusColor(t.status)}">${esc(t.status)}</div></div>
  <div class="field"><div class="field-label">Priority</div><div class="field-value" style="color:${priorityColor(t.priority)}">${esc(t.priority)}</div></div>
  <div class="field"><div class="field-label">Category</div><div class="field-value">${esc(t.category || '—')}${t.subcategory ? ' / ' + esc(t.subcategory) : ''}</div></div>
  <div class="field"><div class="field-label">Channel</div><div class="field-value">${esc(t.channel || '—')}</div></div>
  <div class="field"><div class="field-label">Assignee</div><div class="field-value">${esc(t.assigneeName || 'Unassigned')}</div></div>
  <div class="field"><div class="field-label">Customer</div><div class="field-value">${esc(t.customerName || '—')}</div></div>
  <div class="field"><div class="field-label">Customer Email</div><div class="field-value">${esc(t.customerEmail || '—')}</div></div>
  <div class="field"><div class="field-label">Customer Phone</div><div class="field-value">${esc(t.customerPhone || '—')}</div></div>
</div>

<div class="section-title">Timeline</div>
<div class="grid">
  <div class="field"><div class="field-label">Created</div><div class="field-value">${fmtDate(t.createdAt)}</div></div>
  <div class="field"><div class="field-label">Age</div><div class="field-value">${ageDays}d ${ageHours}h</div></div>
  <div class="field"><div class="field-label">SLA Due</div><div class="field-value" style="color:${isOverdue ? '#dc2626' : '#111827'}">${fmtDate(dueAt)}</div></div>
  <div class="field"><div class="field-label">First Response</div><div class="field-value">${fmtDate(firstResp)}${ttfr != null ? ' <span style="color:#6b7280">(' + ttfr + ' min)</span>' : ''}</div></div>
  <div class="field"><div class="field-label">Resolved</div><div class="field-value">${fmtDate(resolvedAt)}${ttr != null ? ' <span style="color:#6b7280">(' + ttr + ' min)</span>' : ''}</div></div>
  <div class="field"><div class="field-label">Closed</div><div class="field-value">${fmtDate(closedAt)}</div></div>
  <div class="field"><div class="field-label">Last Updated</div><div class="field-value">${fmtDate(t.updatedAt)}</div></div>
  <div class="field"><div class="field-label">SLA State</div><div class="field-value" style="color:${isOverdue ? '#dc2626' : isClosed ? '#16a34a' : '#ca8a04'}">${isOverdue ? 'BREACHED' : isClosed ? 'MET' : 'OPEN'}</div></div>
</div>

${tags && tags.length > 0 ? `
<div class="section-title">Tags</div>
<div class="tags">${tags.map((x: string) => '<span class="tag">' + esc(x) + '</span>').join('')}</div>` : ''}

<div class="section-title">Subject</div>
<div class="body-box"><p class="body-text">${esc(t.subject)}</p></div>

<div class="section-title">Description</div>
<div class="body-box"><p class="body-text">${esc(t.description || 'No description provided.')}</p></div>

${comments.length > 0 ? `
<div class="section-title">Conversation (${comments.length})</div>
${commentsHtml}` : ''}

${attachments.length > 0 ? `
<div class="section-title">Attachments (${attachments.length})</div>
<div class="body-box">${attachmentsHtml}</div>` : ''}

${(t.satisfactionRating || t.satisfactionComment) ? `
<div class="section-title">Customer Satisfaction</div>
<div class="body-box">
  ${t.satisfactionRating ? `<p style="font-size:14px;font-weight:800;color:#db2777;margin:0 0 8px">Rating: ${esc(t.satisfactionRating)} / 5</p>` : ''}
  ${t.satisfactionComment ? `<p class="body-text">${esc(t.satisfactionComment)}</p>` : ''}
</div>` : ''}

<div class="footer"><p>Generated by WaveCore ERP · © ${new Date().getFullYear()} IntelliWavve</p></div>

<script>window.onload = function(){ setTimeout(function(){ window.print(); }, 400); };</script>
</body></html>`

    return new NextResponse(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
  } catch (error) {
    console.error('Ticket detail PDF error:', error)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}