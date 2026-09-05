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
      SELECT w.*,
        (SELECT COUNT(*) FROM "StockLocation" sl WHERE sl."warehouseId" = w.id) as "locationCount",
        (SELECT COALESCE(SUM(sq.quantity), 0) FROM "StockQuantity" sq JOIN "StockLocation" sl ON sq."locationId" = sl.id WHERE sl."warehouseId" = w.id) as "totalStock"
      FROM "Warehouse" w WHERE w.id = $1 AND w."organizationId" = $2
    `, [params.id, session.organizationId])

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Warehouse not found' }, { status: 404 })
    }

    const wh = result.rows[0]

    const html = '<!DOCTYPE html><html><head><title>Warehouse - ' + wh.name + '</title>' +
      '<style>body{font-family:Arial;padding:40px;max-width:800px;margin:0 auto}' +
      '.header{text-align:center;border-bottom:3px solid #7c3aed;padding-bottom:20px;margin-bottom:30px}' +
      '.company{font-size:28px;font-weight:bold;color:#7c3aed}' +
      '.name{font-size:32px;font-weight:bold;text-align:center;margin:30px 0}' +
      '.grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin:30px 0}' +
      '.card{padding:20px;border:2px solid #e5e7eb;border-radius:12px;text-align:center}' +
      '.label{font-size:12px;color:#6b7280;text-transform:uppercase}' +
      '.value{font-size:24px;font-weight:bold;color:#7c3aed;margin-top:8px}' +
      '</style></head><body>' +
      '<div class="header"><div class="company">WaveCore ERP</div><p>Warehouse Report</p></div>' +
      '<div class="name">' + wh.name + '</div>' +
      '<div class="grid">' +
      '<div class="card"><div class="label">Code</div><div class="value">' + (wh.code || 'N/A') + '</div></div>' +
      '<div class="card"><div class="label">Address</div><div class="value" style="font-size:18px">' + (wh.address || 'N/A') + '</div></div>' +
      '<div class="card"><div class="label">City</div><div class="value">' + (wh.city || 'N/A') + '</div></div>' +
      '<div class="card"><div class="label">Country</div><div class="value">' + (wh.country || 'N/A') + '</div></div>' +
      '<div class="card"><div class="label">Locations</div><div class="value">' + (wh.locationCount || 0) + '</div></div>' +
      '<div class="card"><div class="label">Total Stock</div><div class="value">' + (wh.totalStock || 0) + '</div></div>' +
      '</div>' +
      '<script>window.print();</script></body></html>'

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': 'inline; filename="warehouse-' + (wh.code || wh.id) + '.html"'
      }
    })
  } catch (error) {
    console.error('Warehouse PDF error:', error)
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 })
  }
}