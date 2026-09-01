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

    const productId = params.id

    const result = await pool.query(
      `SELECT p.*, COALESCE(sq."availableQty", sq.quantity, 0) as stock_level
       FROM "Product" p
       LEFT JOIN "StockQuantity" sq ON sq."productId" = p.id
       WHERE p.id = $1 AND p."organizationId" = $2`,
      [productId, session.organizationId]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    const product = result.rows[0]
    const sellingPrice = Number(product.sellingPrice || 0)
    const costPrice = Number(product.costPrice || 0)
    const stock = Number(product.stock_level || 0)
    const stockValue = sellingPrice * stock

    const html = `<!DOCTYPE html><html><head><title>${product.name}</title>
<style>body{font-family:Arial;padding:40px;max-width:600px;margin:0 auto}.header{text-align:center;border-bottom:3px solid #ea580c;padding-bottom:20px}.company{font-size:24px;font-weight:bold;color:#ea580c}.card{background:#f9fafb;border-radius:15px;padding:30px}.field{display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid #e5e7eb}.label{font-weight:bold;color:#6b7280}.value{font-weight:bold;color:#111827}.price{text-align:center;font-size:28px;font-weight:bold;color:#ea580c;margin:20px 0}</style></head>
<body><div class="header"><div class="company">IntelliWavve</div><div>Product Details</div></div>
<div class="card"><h2 style="text-align:center;color:#ea580c">${product.name || 'N/A'}</h2>
<div class="price">KSh ${sellingPrice.toLocaleString()}</div>
<div class="field"><span class="label">SKU</span><span class="value">${product.sku || 'N/A'}</span></div>
<div class="field"><span class="label">Barcode</span><span class="value">${product.barcode || 'N/A'}</span></div>
<div class="field"><span class="label">Category</span><span class="value">${product.category || 'N/A'}</span></div>
<div class="field"><span class="label">Unit</span><span class="value">${product.unit || 'N/A'}</span></div>
<div class="field"><span class="label">Cost Price</span><span class="value">KSh ${costPrice.toLocaleString()}</span></div>
<div class="field"><span class="label">Selling Price</span><span class="value">KSh ${sellingPrice.toLocaleString()}</span></div>
<div class="field"><span class="label">Stock</span><span class="value">${stock}</span></div>
<div class="field"><span class="label">Stock Value</span><span class="value">KSh ${stockValue.toLocaleString()}</span></div>
<div class="field"><span class="label">Min Stock</span><span class="value">${product.minStock || 0}</span></div>
<div class="field"><span class="label">Max Stock</span><span class="value">${product.maxStock || 0}</span></div>
</div><script>window.print();</script></body></html>`

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `inline; filename="product-${product.name}.html"`
      }
    })
  } catch (error) {
    console.error('PDF error:', error)
    return NextResponse.json({ error: 'PDF failed: ' + (error as Error).message }, { status: 500 })
  }
}