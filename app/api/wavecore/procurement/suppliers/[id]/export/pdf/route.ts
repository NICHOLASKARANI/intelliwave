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

export async function GET(request: NextRequest, ctx: { params: { id: string } }) {
  try {
    const g = await assertProcurement(request, 'EXPORT')
    const id = ctx.params.id
    const orgId = g.organizationId

    const sRes = await pool.query(
      `SELECT * FROM "Supplier" WHERE id = $1 AND "organizationId" = $2`,
      [id, orgId]
    )
    if (sRes.rowCount === 0) return NextResponse.json({ error: 'Supplier not found' }, { status: 404 })
    const s = sRes.rows[0]

    const [contacts, banks, docs, scores, risks, pos, org] = await Promise.all([
      pool.query(`SELECT * FROM "SupplierContact" WHERE "supplierId" = $1 AND "organizationId" = $2 ORDER BY "isPrimary" DESC`, [id, orgId]),
      pool.query(`SELECT * FROM "SupplierBankAccount" WHERE "supplierId" = $1 AND "organizationId" = $2 ORDER BY "isPrimary" DESC`, [id, orgId]),
      pool.query(`SELECT name, "documentType", status, "expiryDate" FROM "SupplierDocument" WHERE "supplierId" = $1 AND "organizationId" = $2 ORDER BY "createdAt" DESC`, [id, orgId]),
      pool.query(`SELECT * FROM "SupplierScorecard" WHERE "supplierId" = $1 AND "organizationId" = $2 ORDER BY "periodEnd" DESC LIMIT 12`, [id, orgId]),
      pool.query(`SELECT * FROM "SupplierRisk" WHERE "supplierId" = $1 AND "organizationId" = $2 ORDER BY "detectedAt" DESC LIMIT 20`, [id, orgId]),
      pool.query(`SELECT id, "number", "date", status, COALESCE("total", "amount", 0) AS amount, currency FROM "PurchaseOrder" WHERE "supplierId" = $1 AND "organizationId" = $2 ORDER BY "createdAt" DESC LIMIT 30`, [id, orgId]),
      pool.query(`SELECT name FROM "Organization" WHERE id = $1`, [orgId]),
    ])
    const orgName = org.rows[0]?.name || 'Organization'

    const row = (label: string, value: any, muted = false) =>
      '<tr><td class="k">' + esc(label) + '</td><td class="v' + (muted ? ' muted' : '') + '">' + esc(value ?? '—') + '</td></tr>'

    const section = (title: string, body: string) =>
      '<div class="section"><h2>' + esc(title) + '</h2>' + body + '</div>'

    const emptyRow = '<p class="empty">No records</p>'

    const contactsHtml = contacts.rows.length === 0 ? emptyRow :
      '<table class="list">' + contacts.rows.map((c: any) =>
        '<tr><td><strong>' + esc(c.name) + '</strong>' + (c.isPrimary ? ' <span class="pill pill-blue">Primary</span>' : '') +
        '<br><span class="muted">' + esc(c.role || '—') + '</span></td>' +
        '<td>' + esc(c.email || '—') + '<br><span class="muted">' + esc(c.phone || '') + '</span></td></tr>'
      ).join('') + '</table>'

    const banksHtml = banks.rows.length === 0 ? emptyRow :
      '<table class="list">' + banks.rows.map((b: any) =>
        '<tr><td><strong>' + esc(b.bankName) + '</strong>' + (b.isPrimary ? ' <span class="pill pill-blue">Primary</span>' : '') +
        '<br><span class="muted">' + esc(b.accountName) + '</span></td>' +
        '<td>****' + esc(String(b.accountNumber).slice(-4)) + '<br><span class="muted">' + esc(b.currency || '') + '</span></td></tr>'
      ).join('') + '</table>'

    const docsHtml = docs.rows.length === 0 ? emptyRow :
      '<table class="list">' + docs.rows.map((d: any) =>
        '<tr><td><strong>' + esc(d.name) + '</strong><br><span class="muted">' + esc(d.documentType) + '</span></td>' +
        '<td>' + esc(d.status) + '<br><span class="muted">' + (d.expiryDate ? 'expires ' + new Date(d.expiryDate).toLocaleDateString('en-GB') : '') + '</span></td></tr>'
      ).join('') + '</table>'

    const scoresHtml = scores.rows.length === 0 ? emptyRow :
      '<table class="list">' + scores.rows.map((sc: any) =>
        '<tr><td>' + new Date(sc.periodStart).toLocaleDateString('en-GB') + ' → ' + new Date(sc.periodEnd).toLocaleDateString('en-GB') + '</td>' +
        '<td class="score">' + esc(sc.overallScore) + '/100</td></tr>'
      ).join('') + '</table>'

    const risksHtml = risks.rows.length === 0 ? emptyRow :
      '<table class="list">' + risks.rows.map((r: any) =>
        '<tr><td><strong>' + esc(r.title) + '</strong><br><span class="muted">' + esc(r.riskType) + ' · ' + esc(r.status) + '</span></td>' +
        '<td><span class="pill pill-' + esc(String(r.severity).toLowerCase()) + '">' + esc(r.severity) + '</span></td></tr>'
      ).join('') + '</table>'

    const posHtml = pos.rows.length === 0 ? emptyRow :
      '<table class="list">' + pos.rows.map((p: any) =>
        '<tr><td><strong>' + esc(p.number || p.id.slice(0, 8)) + '</strong><br><span class="muted">' + (p.date ? new Date(p.date).toLocaleDateString('en-GB') : '') + '</span></td>' +
        '<td>' + esc(p.currency || 'KES') + ' ' + Number(p.amount || 0).toLocaleString() + '<br><span class="muted">' + esc(p.status) + '</span></td></tr>'
      ).join('') + '</table>'

    const html = '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Supplier — ' + esc(s.name) + '</title>' +
      '<style>' +
      '*{box-sizing:border-box}' +
      'body{font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;margin:0;padding:40px;color:#111;background:#fff}' +
      '.header{border-bottom:3px solid #4f46e5;padding-bottom:20px;margin-bottom:24px}' +
      'h1{margin:0 0 6px 0;font-size:28px}' +
      '.sub{color:#666;font-size:13px}' +
      '.meta{font-size:11px;color:#9ca3af;margin-top:8px}' +
      'h2{font-size:14px;text-transform:uppercase;letter-spacing:0.5px;color:#4f46e5;margin:0 0 12px 0;padding-bottom:6px;border-bottom:1px solid #e5e7eb}' +
      '.section{margin-bottom:24px;page-break-inside:avoid}' +
      'table.info{width:100%;border-collapse:collapse;font-size:12px}' +
      'table.info td{padding:6px 0;border-bottom:1px dotted #e5e7eb}' +
      'td.k{color:#6b7280;width:160px;font-weight:600}' +
      'td.v{color:#111}' +
      'table.list{width:100%;border-collapse:collapse;font-size:12px}' +
      'table.list td{padding:8px 0;border-bottom:1px solid #f3f4f6;vertical-align:top}' +
      'table.list td:last-child{text-align:right}' +
      '.muted{color:#9ca3af;font-size:11px}' +
      '.empty{color:#9ca3af;font-size:12px;font-style:italic;padding:8px 0}' +
      '.pill{display:inline-block;padding:2px 8px;border-radius:999px;font-size:10px;font-weight:700;text-transform:uppercase}' +
      '.pill-blue{background:#dbeafe;color:#1e40af}' +
      '.pill-green{background:#d1fae5;color:#065f46}' +
      '.pill-red{background:#fee2e2;color:#991b1b}' +
      '.pill-amber{background:#fef3c7;color:#92400e}' +
      '.pill-low{background:#d1fae5;color:#065f46}' +
      '.pill-medium{background:#fef3c7;color:#92400e}' +
      '.pill-high{background:#fed7aa;color:#9a3412}' +
      '.pill-critical{background:#fecaca;color:#991b1b}' +
      '.score{font-weight:700;font-size:16px}' +
      '.grid2{display:grid;grid-template-columns:1fr 1fr;gap:32px}' +
      '.footer{margin-top:32px;padding-top:16px;border-top:1px solid #e5e7eb;font-size:10px;color:#9ca3af;text-align:center}' +
      '.actions{margin-bottom:20px;text-align:right}' +
      '.actions button{padding:10px 20px;background:#4f46e5;color:#fff;border:none;border-radius:8px;font-weight:700;cursor:pointer}' +
      '@media print{.actions{display:none}body{padding:20px}}' +
      '</style></head><body>' +
      '<div class="actions"><button onclick="window.print()">Print / Save as PDF</button></div>' +
      '<div class="header">' +
      '<h1>' + esc(s.name) + (s.isPreferred ? ' ★' : '') + (s.isBlacklisted ? ' ⛔' : '') + '</h1>' +
      '<p class="sub">' + esc(s.legalName || s.tradingName || '') + '</p>' +
      '<p class="meta">' + esc(orgName) + ' · Generated ' + new Date().toLocaleString('en-GB') + ' · Status: ' + esc(s.status) + ' · Risk: ' + esc(s.riskLevel || 'LOW') + ' (' + esc(s.riskScore || 0) + ')</p>' +
      '</div>' +
      section('Company Details',
        '<table class="info">' +
        row('Legal Name', s.legalName) +
        row('Trading Name', s.tradingName) +
        row('Registration #', s.registrationNumber) +
        row('Tax PIN', s.taxPin) +
        row('VAT Status', s.vatStatus) +
        row('Website', s.website) +
        row('Category', s.category) +
        row('Country', s.country) +
        row('City', s.city) +
        row('Address', s.address) +
        '</table>') +
      section('Commercial Terms',
        '<table class="info">' +
        row('Currency', s.currency) +
        row('Payment Terms', (s.paymentTerms || 0) + ' days') +
        row('Credit Limit', Number(s.creditLimit || 0).toLocaleString()) +
        row('Status', s.status) +
        row('Preferred', s.isPreferred ? 'Yes' : 'No') +
        row('Blacklisted', s.isBlacklisted ? 'Yes' : 'No') +
        '</table>') +
      '<div class="grid2">' +
      section('Contacts', contactsHtml) +
      section('Bank Accounts', banksHtml) +
      '</div>' +
      '<div class="grid2">' +
      section('Documents', docsHtml) +
      section('Recent Scorecards', scoresHtml) +
      '</div>' +
      section('Risk Flags', risksHtml) +
      section('Recent Purchase Orders', posHtml) +
      '<div class="footer">WaveCore ERP · Procurement · Confidential</div>' +
      '</body></html>'

    return new NextResponse(html, {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' },
    })
  } catch (err) {
    if (err && (err as any).response) return (err as any).response
    console.error('[supplier-export-pdf]', err)
    return NextResponse.json({ error: 'Export failed' }, { status: 500 })
  }
}