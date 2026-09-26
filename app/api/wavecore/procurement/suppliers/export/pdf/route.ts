export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { assertProcurement } from '@/lib/wavecore/procurement-guard'

function esc(s: any): string {
  if (s === null || s === undefined) return ''
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export async function GET(request: NextRequest) {
  try {
    const g = await assertProcurement(request, 'EXPORT')
    const { searchParams } = new URL(request.url)
    const q = (searchParams.get('q') || '').trim()
    const status = searchParams.get('status')
    const category = searchParams.get('category')

    const where: string[] = ['"organizationId" = $1']
    const params: any[] = [g.organizationId]
    if (q) {
      params.push('%' + q + '%')
      where.push('("name" ILIKE $' + params.length + ' OR "legalName" ILIKE $' + params.length + ' OR "taxPin" ILIKE $' + params.length + ')')
    }
    if (status) { params.push(status); where.push('"status" = $' + params.length) }
    if (category) { params.push(category); where.push('"category" = $' + params.length) }

    const result = await pool.query(
      `SELECT name, "legalName", email, phone, category, country, currency,
              "riskLevel", "riskScore", status, "isPreferred", "isBlacklisted", "createdAt"
       FROM "Supplier"
       WHERE ${where.join(' AND ')}
       ORDER BY "createdAt" DESC
       LIMIT 500`,
      params
    )

    const orgRes = await pool.query(
      `SELECT name FROM "Organization" WHERE id = $1`,
      [g.organizationId]
    )
    const orgName = orgRes.rows[0]?.name || 'Organization'

    const rowsHtml = result.rows.map((r: any) => {
      const flags = [
        r.isPreferred ? '<span class="pill pill-amber">Preferred</span>' : '',
        r.isBlacklisted ? '<span class="pill pill-red">Blacklisted</span>' : '',
      ].filter(Boolean).join(' ')
      return `
        <tr>
          <td><strong>${esc(r.name)}</strong>${r.legalName ? '<br><span class="muted">' + esc(r.legalName) + '</span>' : ''}</td>
          <td>${esc(r.email || '—')}<br><span class="muted">${esc(r.phone || '')}</span></td>
          <td>${esc(r.category || '—')}</td>
          <td>${esc(r.country || '—')}</td>
          <td><span class="pill pill-${(r.riskLevel || 'LOW').toLowerCase()}">${esc(r.riskLevel || 'LOW')}</span> <span class="muted">${esc(r.riskScore || 0)}</span></td>
          <td><span class="pill pill-${r.status === 'ACTIVE' ? 'green' : 'gray'}">${esc(r.status || 'ACTIVE')}</span> ${flags}</td>
        </tr>
      `
    }).join('')

    const html = '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Suppliers — ' + esc(orgName) + '</title>' +
      '<style>' +
      '*{box-sizing:border-box}' +
      'body{font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;margin:0;padding:40px;color:#111;background:#fff}' +
      '.header{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #4f46e5;padding-bottom:20px;margin-bottom:24px}' +
      'h1{margin:0 0 4px 0;font-size:28px}' +
      '.sub{color:#666;font-size:13px}' +
      '.meta{text-align:right;font-size:12px;color:#666}' +
      'table{width:100%;border-collapse:collapse;font-size:12px}' +
      'th{text-align:left;background:#f3f4f6;padding:10px 12px;font-weight:700;text-transform:uppercase;font-size:10px;letter-spacing:0.5px;color:#374151;border-bottom:2px solid #e5e7eb}' +
      'td{padding:10px 12px;border-bottom:1px solid #f3f4f6;vertical-align:top}' +
      '.muted{color:#9ca3af;font-size:11px}' +
      '.pill{display:inline-block;padding:2px 8px;border-radius:999px;font-size:10px;font-weight:700;text-transform:uppercase}' +
      '.pill-green{background:#d1fae5;color:#065f46}' +
      '.pill-red{background:#fee2e2;color:#991b1b}' +
      '.pill-amber{background:#fef3c7;color:#92400e}' +
      '.pill-gray{background:#e5e7eb;color:#374151}' +
      '.pill-low{background:#d1fae5;color:#065f46}' +
      '.pill-medium{background:#fef3c7;color:#92400e}' +
      '.pill-high{background:#fed7aa;color:#9a3412}' +
      '.pill-critical{background:#fecaca;color:#991b1b}' +
      '.footer{margin-top:32px;padding-top:16px;border-top:1px solid #e5e7eb;font-size:10px;color:#9ca3af;text-align:center}' +
      '.actions{margin-bottom:20px;text-align:right}' +
      '.actions button{padding:10px 20px;background:#4f46e5;color:#fff;border:none;border-radius:8px;font-weight:700;cursor:pointer}' +
      '@media print{.actions{display:none}body{padding:20px}}' +
      '</style></head><body>' +
      '<div class="actions"><button onclick="window.print()">Print / Save as PDF</button></div>' +
      '<div class="header">' +
      '<div><h1>Suppliers Directory</h1><p class="sub">' + esc(orgName) + '</p></div>' +
      '<div class="meta">Generated: ' + new Date().toLocaleString('en-GB') + '<br>' + result.rows.length + ' supplier(s)</div>' +
      '</div>' +
      '<table><thead><tr>' +
      '<th>Supplier</th><th>Contact</th><th>Category</th><th>Country</th><th>Risk</th><th>Status</th>' +
      '</tr></thead><tbody>' + rowsHtml + '</tbody></table>' +
      '<div class="footer">WaveCore ERP · Procurement · Confidential</div>' +
      '</body></html>'

    return new NextResponse(html, {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' },
    })
  } catch (err) {
    if (err && (err as any).response) return (err as any).response
    console.error('[suppliers-export-pdf]', err)
    return NextResponse.json({ error: 'Export failed' }, { status: 500 })
  }
}