export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const qcRes = await pool.query(
      `SELECT * FROM "QualityCheck" WHERE id = $1 AND "organizationId" = $2`,
      [params.id, session.organizationId]
    )
    if (qcRes.rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    const qc = qcRes.rows[0]

    let wo: any = null
    if (qc.workOrderId) {
      const woRes = await pool.query(
        `SELECT number, "productId", status, quantity, "completedQty" FROM "WorkOrder"
         WHERE "organizationId" = $1 AND (id = $2 OR number = $2) LIMIT 1`,
        [session.organizationId, qc.workOrderId]
      )
      wo = woRes.rows[0] || null
    }

    const inspected = Number(qc.inspectedQty || 0)
    const passed = Number(qc.passedQty || 0)
    const rejected = Number(qc.rejectedQty || 0)
    const passRate = inspected > 0 ? Math.round((passed / inspected) * 100) : 0
    const resultColor = qc.result === 'PASS' ? '#16a34a' : qc.result === 'FAIL' ? '#dc2626' : '#f59e0b'
    const resultBg = qc.result === 'PASS' ? '#dcfce7' : qc.result === 'FAIL' ? '#fee2e2' : '#fef3c7'

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
<title>QC ${qc.id.slice(0, 8)}</title>
<style>
  @page { size: A4; margin: 15mm; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #111827; margin: 0; }
  .hdr { display: flex; justify-content: space-between; border-bottom: 4px solid ${resultColor}; padding-bottom: 18px; margin-bottom: 24px; }
  .brand { font-size: 30px; font-weight: 800; color: ${resultColor}; }
  .brand-sub { font-size: 12px; color: #6b7280; margin-top: 2px; }
  .doc-title h1 { font-size: 22px; margin: 0; }
  .doc-title .num { font-family: 'Courier New', monospace; font-size: 16px; color: ${resultColor}; margin-top: 4px; font-weight: 700; }
  .result-badge { display: inline-block; padding: 10px 24px; border-radius: 24px; font-size: 20px; font-weight: 800; color: ${resultColor}; background: ${resultBg}; letter-spacing: 1px; margin: 8px 0; }
  .meta-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin-bottom: 24px; }
  .meta-card { padding: 12px 14px; border: 1px solid #e5e7eb; border-radius: 10px; background: #f9fafb; }
  .meta-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; color: #6b7280; font-weight: 700; }
  .meta-value { font-size: 15px; font-weight: 700; margin-top: 4px; }
  .section-title { font-size: 14px; font-weight: 800; color: ${resultColor}; text-transform: uppercase; letter-spacing: 0.6px; margin: 26px 0 10px; padding-bottom: 6px; border-bottom: 2px solid ${resultBg}; }
  .big-number { font-size: 36px; font-weight: 900; color: ${resultColor}; }
  .stat-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; margin-top: 12px; }
  .stat-card { padding: 20px; border: 2px solid #e5e7eb; border-radius: 14px; text-align: center; }
  .stat-label { font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 700; }
  .stat-value { font-size: 26px; font-weight: 800; color: #111827; margin-top: 6px; }
  .sign-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; margin-top: 40px; }
  .sign-box { border-top: 1.5px solid #111827; padding-top: 6px; font-size: 11px; color: #6b7280; }
  .footer { margin-top: 40px; text-align: center; color: #9ca3af; font-size: 10px; border-top: 1px solid #e5e7eb; padding-top: 14px; }
</style></head><body>

<div class="hdr">
  <div>
    <div class="brand">WaveCore ERP</div>
    <div class="brand-sub">Manufacturing · Quality Control Report</div>
  </div>
  <div class="doc-title">
    <h1>QUALITY CHECK</h1>
    <div class="num">QC-${qc.id.slice(0, 8).toUpperCase()}</div>
  </div>
</div>

<div style="text-align:center;margin:20px 0">
  <div class="result-badge">${qc.result || 'PENDING'}</div>
</div>

<div class="meta-grid">
  <div class="meta-card"><div class="meta-label">Type</div><div class="meta-value">${qc.type || '—'}</div></div>
  <div class="meta-card"><div class="meta-label">Work Order</div><div class="meta-value">${wo?.number || qc.workOrderId || '—'}</div></div>
  <div class="meta-card"><div class="meta-label">Product</div><div class="meta-value">${wo?.productId || '—'}</div></div>
  <div class="meta-card"><div class="meta-label">Inspected</div><div class="meta-value">${inspected}</div></div>
  <div class="meta-card"><div class="meta-label">Passed</div><div class="meta-value" style="color:#16a34a">${passed}</div></div>
  <div class="meta-card"><div class="meta-label">Rejected</div><div class="meta-value" style="color:#dc2626">${rejected}</div></div>
</div>

<div class="section-title">Quality Metrics</div>
<div class="stat-grid">
  <div class="stat-card">
    <div class="stat-label">Pass Rate</div>
    <div class="stat-value" style="color:#16a34a">${passRate}%</div>
  </div>
  <div class="stat-card">
    <div class="stat-label">Reject Rate</div>
    <div class="stat-value" style="color:#dc2626">${100 - passRate}%</div>
  </div>
  <div class="stat-card">
    <div class="stat-label">Inspected</div>
    <div class="stat-value">${inspected}</div>
  </div>
</div>

${qc.notes ? `<div class="section-title">Notes</div><div style="font-size:12px;padding:12px;background:#f9fafb;border-left:3px solid ${resultColor};border-radius:4px">${qc.notes}</div>` : ''}

<div class="sign-grid">
  <div class="sign-box">Inspector<br><br></div>
  <div class="sign-box">QC Manager<br><br></div>
  <div class="sign-box">Approved By<br><br></div>
</div>

<div class="footer">
  <p>Generated by WaveCore ERP · ${new Date().toLocaleString('en-GB')}</p>
  <p>© ${new Date().getFullYear()} IntelliWavve</p>
</div>

<script>window.onload = function(){ setTimeout(function(){ window.print(); }, 400); };</script>
</body></html>`

    return new NextResponse(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
  } catch (error) {
    console.error('QC PDF error:', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}