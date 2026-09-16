export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const rRes = await pool.query(
      `SELECT * FROM "Routing" WHERE id = $1 AND "organizationId" = $2`,
      [params.id, session.organizationId]
    )
    if (rRes.rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    const routing = rRes.rows[0]

    const opsRes = await pool.query(
      `SELECT * FROM "RoutingOperation" WHERE "routingId" = $1 ORDER BY sequence ASC`,
      [params.id]
    )
    const ops = opsRes.rows

    const totalDuration = ops.reduce((s, o) => s + Number(o.durationMinutes || 0), 0)
    const totalSetup = ops.reduce((s, o) => s + Number(o.setupMinutes || 0), 0)
    const totalTime = totalDuration + totalSetup

    const opRows = ops.length > 0
      ? ops.map((o, i) => {
          const opTotal = Number(o.durationMinutes || 0) + Number(o.setupMinutes || 0)
          const pct = totalTime > 0 ? Math.round((opTotal / totalTime) * 100) : 0
          return `
          <tr>
            <td style="text-align:center;font-weight:700">${o.sequence ?? i + 1}</td>
            <td><b>${o.name || '—'}</b>${o.description ? `<div style="font-size:11px;color:#6b7280;margin-top:2px">${o.description}</div>` : ''}</td>
            <td>${o.workCenterId || '—'}</td>
            <td style="text-align:right">${Number(o.setupMinutes || 0)} min</td>
            <td style="text-align:right">${Number(o.durationMinutes || 0)} min</td>
            <td style="text-align:right;font-weight:700">${opTotal} min</td>
            <td style="text-align:right;color:#0d9488;font-weight:700">${pct}%</td>
          </tr>`
        }).join('')
      : '<tr><td colspan="7" style="text-align:center;color:#9ca3af">No operations defined</td></tr>'

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
<title>Routing ${routing.code || routing.name}</title>
<style>
  @page { size: A4; margin: 15mm; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #111827; margin: 0; }
  .hdr { display: flex; justify-content: space-between; border-bottom: 4px solid #0d9488; padding-bottom: 18px; margin-bottom: 24px; }
  .brand { font-size: 30px; font-weight: 800; color: #0d9488; }
  .brand-sub { font-size: 12px; color: #6b7280; margin-top: 2px; }
  .doc-title h1 { font-size: 22px; margin: 0; }
  .doc-title .num { font-family: 'Courier New', monospace; font-size: 16px; color: #0d9488; margin-top: 4px; font-weight: 700; }
  .meta-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin-bottom: 24px; }
  .meta-card { padding: 12px 14px; border: 1px solid #e5e7eb; border-radius: 10px; background: #f0fdfa; }
  .meta-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; color: #6b7280; font-weight: 700; }
  .meta-value { font-size: 15px; font-weight: 700; margin-top: 4px; }
  .section-title { font-size: 14px; font-weight: 800; color: #0d9488; text-transform: uppercase; letter-spacing: 0.6px; margin: 26px 0 10px; padding-bottom: 6px; border-bottom: 2px solid #ccfbf1; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  thead th { background: #0d9488; color: white; text-align: left; padding: 10px 8px; font-size: 11px; text-transform: uppercase; }
  tbody td { padding: 10px 8px; border-bottom: 1px solid #f3f4f6; }
  tbody tr:nth-child(even) { background: #f0fdfa; }
  .totals { margin-top: 14px; padding: 14px; background: #f0fdfa; border-radius: 10px; display: flex; justify-content: space-between; font-size: 14px; font-weight: 800; color: #0d9488; }
  .footer { margin-top: 40px; text-align: center; color: #9ca3af; font-size: 10px; border-top: 1px solid #e5e7eb; padding-top: 14px; }
</style></head><body>

<div class="hdr">
  <div>
    <div class="brand">WaveCore ERP</div>
    <div class="brand-sub">Manufacturing · Production Routing</div>
  </div>
  <div class="doc-title">
    <h1>ROUTING</h1>
    <div class="num">${routing.code || routing.name}</div>
  </div>
</div>

<div class="meta-grid">
  <div class="meta-card"><div class="meta-label">Name</div><div class="meta-value">${routing.name}</div></div>
  <div class="meta-card"><div class="meta-label">Product</div><div class="meta-value">${routing.productId || '—'}</div></div>
  <div class="meta-card"><div class="meta-label">Operations</div><div class="meta-value">${ops.length}</div></div>
  <div class="meta-card"><div class="meta-label">Total Setup</div><div class="meta-value">${totalSetup} min</div></div>
  <div class="meta-card"><div class="meta-label">Total Duration</div><div class="meta-value">${totalDuration} min</div></div>
  <div class="meta-card"><div class="meta-label">Total Time</div><div class="meta-value">${totalTime} min</div></div>
</div>

<div class="section-title">Operations Sequence</div>
<table>
  <thead>
    <tr>
      <th style="text-align:center;width:60px">Seq</th>
      <th>Operation</th>
      <th>Work Center</th>
      <th style="text-align:right">Setup</th>
      <th style="text-align:right">Duration</th>
      <th style="text-align:right">Total</th>
      <th style="text-align:right">% of Route</th>
    </tr>
  </thead>
  <tbody>${opRows}</tbody>
</table>

<div class="totals">
  <span>Total Setup: ${totalSetup} min</span>
  <span>Total Duration: ${totalDuration} min</span>
  <span>Total Time: ${totalTime} min</span>
</div>

<div class="footer">
  <p>Generated by WaveCore ERP · ${new Date().toLocaleString('en-GB')}</p>
  <p>© ${new Date().getFullYear()} IntelliWavve</p>
</div>

<script>window.onload = function(){ setTimeout(function(){ window.print(); }, 400); };</script>
</body></html>`

    return new NextResponse(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
  } catch (error) {
    console.error('Routing PDF error:', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}