export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const prodRes = await pool.query(
      `SELECT id, name, sku, unit, "costPrice", "minStock", "maxStock" FROM "Product"
       WHERE "organizationId" = $1 ORDER BY name ASC LIMIT 500`,
      [session.organizationId]
    )
    const products = prodRes.rows

    const productIds = products.map(p => p.id)
    const productNames = products.map(p => p.name)

    const stockRes = await pool.query(
      `SELECT "productId", COALESCE(SUM(quantity), 0) AS "onHand"
       FROM "StockQuantity" WHERE "productId" = ANY($1::text[])
       GROUP BY "productId"`,
      [productIds]
    ).catch(() => ({ rows: [] }))
    const stockMap: Record<string, number> = {}
    for (const row of stockRes.rows) stockMap[row.productId] = Number(row.onHand || 0)

    const woRes = await pool.query(
      `SELECT "productId", COALESCE(SUM(quantity - COALESCE("completedQty", 0)), 0) AS allocated
       FROM "WorkOrder"
       WHERE "organizationId" = $1
         AND status NOT IN ('COMPLETED', 'CANCELLED')
         AND ("productId" = ANY($2::text[]) OR "productId" = ANY($3::text[]))
       GROUP BY "productId"`,
      [session.organizationId, productIds, productNames]
    ).catch(() => ({ rows: [] }))
    const allocatedMap: Record<string, number> = {}
    for (const row of woRes.rows) allocatedMap[row.productId] = Number(row.allocated || 0)

    const items = products.map(p => {
      const onHand = stockMap[p.id] ?? stockMap[p.name] ?? 0
      const allocated = allocatedMap[p.id] ?? allocatedMap[p.name] ?? 0
      const minStock = Number(p.minStock || 0)
      const maxStock = Number(p.maxStock || 0)
      const available = onHand - allocated
      const safetyStock = Math.max(0, Math.round(minStock * 0.2))
      let status = 'OK'
      let suggestedQty = 0
      if (available < 0) { status = 'SHORTAGE'; suggestedQty = Math.abs(available) + safetyStock }
      else if (available < minStock) { status = 'LOW'; suggestedQty = minStock + safetyStock - available }
      else if (maxStock > 0 && available > maxStock) { status = 'SURPLUS' }
      return { ...p, onHand, allocated, available, suggestedQty, safetyStock, status, unitCost: Number(p.costPrice || 0) }
    })

    const shortage = items.filter(i => i.status === 'SHORTAGE').length
    const low = items.filter(i => i.status === 'LOW').length
    const surplus = items.filter(i => i.status === 'SURPLUS').length
    const totalValueAtRisk = items.reduce((s, i) => s + i.suggestedQty * i.unitCost, 0)

    const rows = items.map(i => {
      const color = i.status === 'SHORTAGE' ? '#dc2626' : i.status === 'LOW' ? '#ca8a04' : i.status === 'SURPLUS' ? '#7c3aed' : '#16a34a'
      return `
        <tr>
          <td><b>${i.name}</b><div style="font-size:10px;color:#6b7280">${i.sku || ''}</div></td>
          <td style="text-align:right">${i.onHand}</td>
          <td style="text-align:right">${i.allocated}</td>
          <td style="text-align:right;font-weight:700;color:${i.available < 0 ? '#dc2626' : '#111827'}">${i.available}</td>
          <td style="text-align:right">${i.minStock || 0}</td>
          <td style="text-align:right;font-weight:700;color:${color}">${i.suggestedQty || 0}</td>
          <td style="text-align:center"><span style="padding:3px 10px;border-radius:10px;background:${color}22;color:${color};font-size:10px;font-weight:700">${i.status}</span></td>
        </tr>`
    }).join('')

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
<title>MRP Report</title>
<style>
  @page { size: A4 landscape; margin: 12mm; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #111827; margin: 0; }
  .hdr { display: flex; justify-content: space-between; border-bottom: 4px solid #4f46e5; padding-bottom: 16px; margin-bottom: 20px; }
  .brand { font-size: 28px; font-weight: 800; color: #4f46e5; }
  .brand-sub { font-size: 12px; color: #6b7280; margin-top: 2px; }
  .doc-title h1 { font-size: 22px; margin: 0; }
  .doc-title .num { font-family: 'Courier New', monospace; font-size: 14px; color: #4f46e5; margin-top: 4px; font-weight: 700; }
  .stats { display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; margin-bottom: 24px; }
  .stat { padding: 14px; border: 2px solid #e5e7eb; border-radius: 10px; text-align: center; }
  .stat-num { font-size: 24px; font-weight: 800; }
  .stat-label { font-size: 10px; text-transform: uppercase; color: #6b7280; letter-spacing: 0.5px; font-weight: 700; margin-top: 4px; }
  table { width: 100%; border-collapse: collapse; font-size: 11px; }
  thead th { background: #4f46e5; color: white; text-align: left; padding: 10px 8px; font-size: 10px; text-transform: uppercase; }
  tbody td { padding: 8px; border-bottom: 1px solid #f3f4f6; }
  tbody tr:nth-child(even) { background: #eef2ff; }
  .footer { margin-top: 30px; text-align: center; color: #9ca3af; font-size: 10px; border-top: 1px solid #e5e7eb; padding-top: 12px; }
  .totals { margin-top: 14px; padding: 14px; background: #eef2ff; border-radius: 10px; display: flex; justify-content: space-between; font-size: 13px; font-weight: 800; color: #4f46e5; }
</style></head><body>

<div class="hdr">
  <div>
    <div class="brand">WaveCore ERP</div>
    <div class="brand-sub">Manufacturing · Material Requirements Planning</div>
  </div>
  <div class="doc-title">
    <h1>MRP REPORT</h1>
    <div class="num">Generated ${new Date().toLocaleDateString('en-GB')}</div>
  </div>
</div>

<div class="stats">
  <div class="stat"><div class="stat-num">${items.length}</div><div class="stat-label">Products</div></div>
  <div class="stat"><div class="stat-num" style="color:#dc2626">${shortage}</div><div class="stat-label">Shortage</div></div>
  <div class="stat"><div class="stat-num" style="color:#ca8a04">${low}</div><div class="stat-label">Low</div></div>
  <div class="stat"><div class="stat-num" style="color:#7c3aed">${surplus}</div><div class="stat-label">Surplus</div></div>
  <div class="stat"><div class="stat-num" style="color:#4f46e5">${Math.round(totalValueAtRisk)}</div><div class="stat-label">Value at Risk</div></div>
</div>

<table>
  <thead>
    <tr>
      <th>Product</th>
      <th style="text-align:right">On Hand</th>
      <th style="text-align:right">Allocated</th>
      <th style="text-align:right">Available</th>
      <th style="text-align:right">Reorder Point</th>
      <th style="text-align:right">Suggested Order</th>
      <th style="text-align:center">Status</th>
    </tr>
  </thead>
  <tbody>${rows}</tbody>
</table>

<div class="totals">
  <span>Total Suggested Order Value: ${Math.round(totalValueAtRisk).toLocaleString()}</span>
  <span>Generated: ${new Date().toLocaleString('en-GB')}</span>
</div>

<div class="footer">
  <p>Generated by WaveCore ERP · © ${new Date().getFullYear()} IntelliWavve</p>
</div>

<script>window.onload = function(){ setTimeout(function(){ window.print(); }, 400); };</script>
</body></html>`

    return new NextResponse(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
  } catch (error) {
    console.error('MRP PDF error:', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}