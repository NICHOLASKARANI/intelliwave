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
function parseTags(raw: any): string[] {
  if (!raw) return []
  try {
    const a = typeof raw === 'string' ? JSON.parse(raw) : raw
    return Array.isArray(a) ? a.map(String) : [String(raw)]
  } catch {
    return String(raw).split(',').map(s => s.trim()).filter(Boolean)
  }
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const guard = await guardHR(request, 'HR_EXPORT')
    if (guard.deny) return guard.response!

    const res = await pool.query(
      `SELECT * FROM "KnowledgeArticle" WHERE id = $1 AND "organizationId" = $2`,
      [params.id, session.organizationId]
    )
    if (res.rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    const a = res.rows[0]

    const tags = parseTags(a.tags)
    const totalVotes = Number(a.helpful || 0) + Number(a.notHelpful || 0)
    const helpfulPct = totalVotes > 0 ? Math.round((Number(a.helpful || 0) / totalVotes) * 100) : null

    const statusColor = (s: string) =>
      s === 'PUBLISHED' ? '#16a34a' :
      s === 'DRAFT' ? '#6b7280' :
      s === 'ARCHIVED' ? '#dc2626' : '#6b7280'

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
<title>${esc(a.title)}</title>
<style>
  @page { size: A4 portrait; margin: 15mm; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #111827; margin: 0; }
  .hdr { display: flex; justify-content: space-between; border-bottom: 4px solid #0891b2; padding-bottom: 16px; margin-bottom: 20px; }
  .brand { font-size: 26px; font-weight: 800; color: #0891b2; }
  .brand-sub { font-size: 11px; color: #6b7280; margin-top: 2px; }
  .doc-title h1 { font-size: 18px; margin: 0; }
  .doc-title .num { font-family: 'Courier New', monospace; font-size: 11px; color: #0891b2; margin-top: 4px; font-weight: 700; }
  .section-title { font-size: 12px; font-weight: 800; color: #0891b2; text-transform: uppercase; letter-spacing: 0.6px; margin: 20px 0 10px; padding-bottom: 4px; border-bottom: 2px solid #e0f2fe; }
  .grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin-bottom: 16px; }
  .field { padding: 8px 10px; border: 1px solid #e5e7eb; border-radius: 6px; }
  .field-label { font-size: 9px; text-transform: uppercase; color: #6b7280; letter-spacing: 0.5px; font-weight: 700; }
  .field-value { font-size: 12px; color: #111827; margin-top: 2px; font-weight: 600; word-break: break-word; }
  .body-box { padding: 16px; border: 1px solid #e5e7eb; border-radius: 8px; background: #f9fafb; }
  .body-text { font-size: 12px; color: #374151; line-height: 1.6; white-space: pre-wrap; margin: 0; }
  .tags { display: flex; flex-wrap: wrap; gap: 6px; }
  .tag { padding: 3px 8px; border-radius: 8px; background: #e0f2fe; color: #0369a1; font-size: 10px; font-weight: 700; }
  .footer { margin-top: 30px; text-align: center; color: #9ca3af; font-size: 10px; border-top: 1px solid #e5e7eb; padding-top: 12px; }
</style></head><body>

<div class="hdr">
  <div><div class="brand">WaveCore ERP</div><div class="brand-sub">Helpdesk · Knowledge Base</div></div>
  <div class="doc-title"><h1>KNOWLEDGE ARTICLE</h1><div class="num">${esc((a.id || '').slice(0, 8).toUpperCase())}</div></div>
</div>

<div class="section-title">Meta</div>
<div class="grid">
  <div class="field"><div class="field-label">Status</div><div class="field-value" style="color:${statusColor(a.status)}">${esc(a.status || '—')}</div></div>
  <div class="field"><div class="field-label">Category</div><div class="field-value">${esc(a.category || '—')}</div></div>
  <div class="field"><div class="field-label">Slug</div><div class="field-value" style="font-family:monospace;font-size:10px">${esc(a.slug || '—')}</div></div>
  <div class="field"><div class="field-label">Author</div><div class="field-value">${esc(a.authorName || '—')}</div></div>
  <div class="field"><div class="field-label">Views</div><div class="field-value">${esc(a.views || 0)}</div></div>
  <div class="field"><div class="field-label">Helpful</div><div class="field-value">${helpfulPct != null ? helpfulPct + '%' : '—'} <span style="color:#6b7280;font-size:10px">(${esc(a.helpful || 0)}/${esc(a.notHelpful || 0)})</span></div></div>
  <div class="field"><div class="field-label">Created</div><div class="field-value" style="font-size:11px">${fmtDate(a.createdAt)}</div></div>
  <div class="field"><div class="field-label">Published</div><div class="field-value" style="font-size:11px">${fmtDate(a.publishedAt)}</div></div>
  <div class="field"><div class="field-label">Updated</div><div class="field-value" style="font-size:11px">${fmtDate(a.updatedAt)}</div></div>
</div>

${tags.length > 0 ? `
<div class="section-title">Tags</div>
<div class="tags">${tags.map(t => '<span class="tag">' + esc(t) + '</span>').join('')}</div>` : ''}

<div class="section-title">Title</div>
<div class="body-box"><p class="body-text" style="font-size:15px;font-weight:700">${esc(a.title)}</p></div>

<div class="section-title">Body</div>
<div class="body-box"><p class="body-text">${esc(a.body || 'No content.')}</p></div>

<div class="footer"><p>Generated by WaveCore ERP · © ${new Date().getFullYear()} IntelliWavve</p></div>

<script>window.onload = function(){ setTimeout(function(){ window.print(); }, 400); };</script>
</body></html>`

    return new NextResponse(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
  } catch (error) {
    console.error('KB article PDF error:', error)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}