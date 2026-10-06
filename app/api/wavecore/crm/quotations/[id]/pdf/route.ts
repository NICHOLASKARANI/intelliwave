export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/wavecore/auth'
import { pool } from '@/lib/wavecore/db'

function esc(s: any): string {
  return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!))
}
function money(n: any): string {
  return 'KSh ' + Number(n || 0).toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
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

    const qRes = await pool.query(
      `SELECT q.*, c.name AS "customerName", c.email AS "customerEmail",
              c.phone AS "customerPhone", c.company AS "customerCompany",
              c.address AS "customerAddress", c.city AS "customerCity"
       FROM "Quotation" q
       LEFT JOIN "Customer" c ON c.id = q."customerId"
       WHERE q.id = $1 AND q."organizationId" = $2`,
      [params.id, session.organizationId]
    )
    if (qRes.rowCount === 0) return NextResponse.json({ error: 'Quotation not found' }, { status: 404 })
    const q = qRes.rows[0]

    const itemsRes = await pool.query(
      `SELECT id, description, quantity, "unitPrice", total
       FROM "QuotationItem" WHERE "quotationId" = $1
       ORDER BY "createdAt" ASC`,
      [params.id]
    ).catch(() => ({ rows: [] as any[] }))
    const items = itemsRes.rows

    const linesHtml = items.length === 0
      ? '<tr><td colspan="5" style="text-align:center;color:#6b7280;padding:20px;">No line items recorded.</td></tr>'
      : items.map((it: any, i: number) => `
          <tr>
            <td style="padding:8px;border-bottom:1px solid #e5e7eb;">${i + 1}</td>
            <td style="padding:8px;border-bottom:1px solid #e5e7eb;">${esc(it.description)}</td>
            <td style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:right;">${esc(it.quantity)}</td>
            <td style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:right;">${money(it.unitPrice)}</td>
            <td style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:right;font-weight:bold;">${money(it.total)}</td>
          </tr>`).join('')

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Quotation ${esc(q.number)}</title>
  <style>
    body { font-family: Arial, Helvetica, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; color: #111827; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #d97706; padding-bottom: 20px; margin-bottom: 24px; }
    .company { font-size: 26px; font-weight: bold; color: #d97706; }
    .subtitle { font-size: 13px; color: #6b7280; margin-top: 4px; }
    .doc-meta { text-align: right; font-size: 13px; }
    .doc-meta strong { color: #111827; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px; }
    .card { background: #f9fafb; border-radius: 12px; padding: 18px; }
    .card h3 { margin: 0 0 10px 0; font-size: 12px; text-transform: uppercase; color: #6b7280; letter-spacing: .05em; }
    .card p { margin: 2px 0; font-size: 14px; }
    table { width: 100%; border-collapse: collapse; font-size: 14px; margin-bottom: 20px; }
    th { background: #f3f4f6; padding: 10px 8px; text-align: left; font-size: 12px; text-transform: uppercase; color: #6b7280; letter-spacing: .05em; }
    .totals { margin-left: auto; width: 320px; }
    .totals .row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 14px; }
    .totals .grand { border-top: 2px solid #111827; margin-top: 8px; padding-top: 10px; font-size: 18px; font-weight: bold; color: #d97706; }
    .notes { background: #fffbeb; border-left: 4px solid #d97706; padding: 12px; border-radius: 6px; font-size: 13px; margin-top: 16px; white-space: pre-wrap; }
    .footer { margin-top: 40px; text-align: center; font-size: 11px; color: #6b7280; border-top: 1px solid #e5e7eb; padding-top: 16px; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="company">IntelliWavve</div>
      <div class="subtitle">Quotation</div>
    </div>
    <div class="doc-meta">
      <p><strong>${esc(q.number)}</strong></p>
      <p>Date: ${dateFmt(q.date || q.createdAt)}</p>
      ${q.validUntil ? `<p>Valid until: ${dateFmt(q.validUntil)}</p>` : ''}
      <p>Status: <strong>${esc(q.status || 'DRAFT')}</strong></p>
    </div>
  </div>

  <div class="grid">
    <div class="card">
      <h3>Customer</h3>
      <p><strong>${esc(q.customerName || '—')}</strong></p>
      ${q.customerCompany ? `<p>${esc(q.customerCompany)}</p>` : ''}
      ${q.customerEmail ? `<p>${esc(q.customerEmail)}</p>` : ''}
      ${q.customerPhone ? `<p>${esc(q.customerPhone)}</p>` : ''}
      ${q.customerAddress ? `<p>${esc(q.customerAddress)}${q.customerCity ? ', ' + esc(q.customerCity) : ''}</p>` : ''}
    </div>
    <div class="card">
      <h3>Summary</h3>
      <p>Line items: <strong>${items.length}</strong></p>
      <p>Subtotal: <strong>${money(q.subtotal)}</strong></p>
      <p>Tax: <strong>${money(q.taxAmount)}</strong></p>
      <p>Total: <strong>${money(q.total)}</strong></p>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width:40px;">#</th>
        <th>Description</th>
        <th style="text-align:right;width:80px;">Qty</th>
        <th style="text-align:right;width:120px;">Unit price</th>
        <th style="text-align:right;width:130px;">Line total</th>
      </tr>
    </thead>
    <tbody>${linesHtml}</tbody>
  </table>

  <div class="totals">
    <div class="row"><span>Subtotal</span><span>${money(q.subtotal)}</span></div>
    <div class="row"><span>Tax</span><span>${money(q.taxAmount)}</span></div>
    <div class="row grand"><span>Total</span><span>${money(q.total)}</span></div>
  </div>

  ${q.notes ? `<div class="notes"><strong>Notes:</strong><br>${esc(q.notes)}</div>` : ''}

  <div class="footer">
    System-generated quotation from IntelliWavve ERP.<br>
    Generated ${new Date().toLocaleString('en-KE')}
  </div>

  <script>window.print();</script>
</body>
</html>`

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `inline; filename="quotation-${q.number || q.id.substring(0, 8)}.html"`,
      },
    })
  } catch (error) {
    console.error('[quotation pdf]', error)
    return NextResponse.json({ error: 'PDF failed: ' + (error as Error).message }, { status: 500 })
  }
}