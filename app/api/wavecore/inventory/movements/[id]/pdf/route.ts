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

    const result = await pool.query(`
      SELECT sm.*, p.name as "productName", p.sku
      FROM "StockMove" sm
      LEFT JOIN "Product" p ON p.id = sm."productId"
      WHERE sm.id = $1 AND sm."organizationId" = $2
    `, [params.id, session.organizationId])

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Movement not found' }, { status: 404 })
    }

    const m = result.rows[0]

    const html = '<!DOCTYPE html><html><head><title>Movement - ' + m.id + '</title>' +
      '<style>body{font-family:Arial;padding:40px;max-width:800px;margin:0 auto}' +
      '.header{text-align:center;border-bottom:3px solid #16a34a;padding-bottom:20px;margin-bottom:30px}' +
      '.company{font-size:28px;font-weight:bold;color:#16a34a}' +
      '.grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin:30px 0}' +
      '.card{padding:20px;border:2px solid #e5e7eb;border-radius:12px;text-align:center}' +
      '.label{font-size:12px;color:#6b7280;text-transform:uppercase}' +
      '.value{font-size:24px;font-weight:bold;color:#16a34a;margin-top:8px}' +
      '</style></head><body>' +
      '<div class="header"><div class="company">WaveCore ERP</div><p>Stock Movement</p></div>' +
      '<div class="grid">' +
      '<div class="card"><div class="label">Product</div><div class="value">' + (m.productName || 'N/A') + '</div></div>' +
      '<div class="card"><div class="label">SKU</div><div class="value">' + (m.sku || 'N/A') + '</div></div>' +
      '<div class="card"><div class="label">Type</div><div class="value">' + m.type + '</div></div>' +
      '<div class="card"><div class="label">Quantity</div><div class="value">' + m.quantity + '</div></div>' +
      '<div class="card"><div class="label">Status</div><div class="value">' + m.status + '</div></div>' +
      '<div class="card"><div class="label">Date</div><div class="value" style="font-size:16px">' + new Date(m.date || m.createdAt).toLocaleString() + '</div></div>' +
      '</div>' +
      '<script>window.print();</script></body></html>'

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': 'inline; filename="movement-' + m.id.substring(0, 8) + '.html"'
      }
    })
  } catch (error) {
    console.error('Movement PDF error:', error)
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 })
  }
}