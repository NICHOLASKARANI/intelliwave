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
      SELECT 
        p.*,
        COALESCE(sq.quantity, 0) as "currentStock",
        COALESCE(sq."availableQty", COALESCE(sq.quantity, 0)) as "availableStock",
        COALESCE(sq."reservedQty", 0) as "reservedStock"
      FROM "Product" p
      LEFT JOIN "StockQuantity" sq ON sq."productId" = p.id
      WHERE p.id = $1 AND p."organizationId" = $2
    `, [params.id, session.organizationId])

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    const product = result.rows[0]
    const stockValue = Number(product.sellingPrice || 0) * Number(product.currentStock || 0)
    const costValue = Number(product.costPrice || 0) * Number(product.currentStock || 0)
    const potentialProfit = stockValue - costValue

    const html = `<!DOCTYPE html>
<html>
<head>
  <title>Inventory Report - ${product.name}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; background: #fff; }
    .header { text-align: center; border-bottom: 4px solid #4f46e5; padding-bottom: 20px; margin-bottom: 30px; }
    .company { font-size: 28px; font-weight: bold; color: #4f46e5; }
    .title { font-size: 18px; color: #6b7280; margin-top: 5px; }
    .product-name { font-size: 32px; font-weight: bold; text-align: center; color: #111827; margin: 30px 0; }
    .status-badge { display: inline-block; padding: 8px 16px; border-radius: 9999px; font-weight: bold; font-size: 14px; }
    .status-in { background: #d1fae5; color: #065f46; }
    .status-low { background: #fef3c7; color: #92400e; }
    .status-out { background: #fee2e2; color: #991b1b; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin: 30px 0; }
    .info-card { padding: 20px; border: 2px solid #e5e7eb; border-radius: 12px; text-align: center; }
    .info-card.highlight { border-color: #4f46e5; background: #eef2ff; }
    .info-label { font-size: 12px; color: #6b7280; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px; }
    .info-value { font-size: 24px; font-weight: bold; color: #4f46e5; }
    .info-value.green { color: #16a34a; }
    .info-value.red { color: #dc2626; }
    .info-value.yellow { color: #d97706; }
    .footer { margin-top: 40px; text-align: center; color: #9ca3af; font-size: 12px; border-top: 1px solid #e5e7eb; padding-top: 20px; }
    .barcode { text-align: center; margin: 20px 0; font-family: monospace; font-size: 14px; letter-spacing: 2px; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <div class="header">
    <div class="company">IntelliWavve WaveCore ERP</div>
    <div class="title">Inventory Product Report</div>
  </div>
  
  <div class="product-name">${product.name}</div>
  
  <div class="barcode">SKU: ${product.sku || 'N/A'} | ID: ${product.id}</div>
  
  <div style="text-align: center; margin: 20px 0;">
    ${Number(product.currentStock || 0) === 0 
      ? '<span class="status-badge status-out">OUT OF STOCK</span>' 
      : Number(product.currentStock || 0) < Number(product.minStock || 10) 
        ? '<span class="status-badge status-low">LOW STOCK</span>' 
        : '<span class="status-badge status-in">IN STOCK</span>'}
  </div>
  
  <div class="info-grid">
    <div class="info-card">
      <div class="info-label">Category</div>
      <div class="info-value" style="font-size: 18px;">${product.category || 'N/A'}</div>
    </div>
    <div class="info-card">
      <div class="info-label">Unit</div>
      <div class="info-value" style="font-size: 18px;">${product.unit || 'pcs'}</div>
    </div>
    <div class="info-card">
      <div class="info-label">Cost Price</div>
      <div class="info-value">KSh ${Number(product.costPrice || 0).toLocaleString()}</div>
    </div>
    <div class="info-card">
      <div class="info-label">Selling Price</div>
      <div class="info-value">KSh ${Number(product.sellingPrice || 0).toLocaleString()}</div>
    </div>
    <div class="info-card">
      <div class="info-label">Current Stock</div>
      <div class="info-value ${Number(product.currentStock || 0) === 0 ? 'red' : Number(product.currentStock || 0) < Number(product.minStock || 10) ? 'yellow' : 'green'}">
        ${product.currentStock || 0} ${product.unit || 'pcs'}
      </div>
    </div>
    <div class="info-card">
      <div class="info-label">Reorder Level</div>
      <div class="info-value">${product.minStock || 10} ${product.unit || 'pcs'}</div>
    </div>
    <div class="info-card">
      <div class="info-label">Available</div>
      <div class="info-value green">${product.availableStock || 0}</div>
    </div>
    <div class="info-card">
      <div class="info-label">Reserved</div>
      <div class="info-value yellow">${product.reservedStock || 0}</div>
    </div>
    <div class="info-card highlight">
      <div class="info-label">Stock Value (Selling)</div>
      <div class="info-value" style="font-size: 28px;">KSh ${stockValue.toLocaleString()}</div>
    </div>
    <div class="info-card highlight">
      <div class="info-label">Potential Profit</div>
      <div class="info-value green" style="font-size: 28px;">KSh ${potentialProfit.toLocaleString()}</div>
    </div>
  </div>
  
  <div class="footer">
    <p>Generated by IntelliWavve WaveCore ERP - Intelligent Inventory Management</p>
    <p>${new Date().toLocaleString('en-KE')}</p>
  </div>
  
  <script>window.print();</script>
</body>
</html>`

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `inline; filename="inventory-${product.sku || product.id}.html"`
      }
    })
  } catch (error) {
    console.error('Inventory PDF error:', error)
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 })
  }
}