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
      SELECT * FROM "CycleCount"
      WHERE id = $1 AND "organizationId" = $2
    `, [params.id, session.organizationId])

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Count not found' }, { status: 404 })
    }

    const count = result.rows[0]

    const html = '<!DOCTYPE html><html><head><title>Cycle Count - ' + count.number + '</title>' +
      '<style>body{font-family:Arial;padding:40px;max-width:800px;margin:0 auto}' +
      '.header{text-align:center;border-bottom:3px solid #0891b2;padding-bottom:20px;margin-bottom:30px}' +
      '.company{font-size:28px;font-weight:bold;color:#0891b2}' +
      '.grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin:30px 0}' +
      '.card{padding:20px;border:2px solid #e5e7eb;border-radius:12px;text-align:center}' +
      '.label{font-size:12px;color:#6b7280;text-transform:uppercase}' +
      '.value{font-size:24px;font-weight:bold;color:#0891b2;margin-top:8px}' +
      '</style></head><body>' +
      '<div class="header"><div class="company">WaveCore ERP</div><p>Cycle Count Report</p></div>' +
      '<div class="grid">' +
      '<div class="card"><div class="label">Number</div><div class="value">' + count.number + '</div></div>' +
      '<div class="card"><div class="label">Product</div><div class="value">' + count.productName + '</div></div>' +
      '<div class="card"><div class="label">Expected</div><div class="value">' + count.expectedQuantity + '</div></div>' +
      '<div class="card"><div class="label">Counted</div><div class="value">' + (count.countedQuantity || 'N/A') + '</div></div>' +
      '<div class="card"><div class="label">Variance</div><div class="value">' + (count.variance || 0) + '</div></div>' +
      '<div class="card"><div class="label">Status</div><div class="value">' + count.status + '</div></div>' +
      '</div>' +
      '<script>window.print();</script></body></html>'

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': 'inline; filename="count-' + count.number + '.html"'
      }
    })
  } catch (error) {
    console.error('Count PDF error:', error)
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 })
  }
}