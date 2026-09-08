export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/wavecore/auth'
import { pool } from '@/lib/wavecore/db'

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const query = (searchParams.get('query') || '').toLowerCase()
    const orgId = session.organizationId

    let answer = ''
    let suggestions: string[] = []
    let data: any[] = []

    if (query.includes('stock out') || query.includes('stockout') || query.includes('shortage') || query.includes('run out')) {
      const result = await pool.query(`
        SELECT p.id, p.name, p.sku, COALESCE(sq.quantity, 0) as "currentStock", p."minStock", p."sellingPrice"
        FROM "Product" p
        LEFT JOIN "StockQuantity" sq ON sq."productId" = p.id
        WHERE p."organizationId" = $1 
          AND COALESCE(sq.quantity, 0) < COALESCE(p."minStock", 10)
        ORDER BY COALESCE(sq.quantity, 0) ASC
        LIMIT 20
      `, [orgId]).catch(() => ({ rows: [] }))
      
      data = result.rows
      answer = data.length > 0 
        ? 'Found ' + data.length + ' products at risk of stocking out. Top priority: ' + data[0].name + ' (only ' + data[0].currentStock + ' units left, minimum is ' + data[0].minStock + ').'
        : 'All products are adequately stocked. No stockout risk detected.'
      suggestions = ['Show dead stock', 'What needs reordering?', 'Show overstocked items']
    }
    else if (query.includes('dead') || query.includes('slow moving') || query.includes('slow-moving') || query.includes('not moving')) {
      const result = await pool.query(`
        SELECT p.id, p.name, p.sku, COALESCE(sq.quantity, 0) as "currentStock", p."sellingPrice",
          p."sellingPrice" * COALESCE(sq.quantity, 0) as "stockValue"
        FROM "Product" p
        LEFT JOIN "StockQuantity" sq ON sq."productId" = p.id
        WHERE p."organizationId" = $1 AND COALESCE(sq.quantity, 0) > 0
          AND p.id NOT IN (SELECT DISTINCT "productId" FROM "StockMove" WHERE "organizationId" = $1 AND "createdAt" > NOW() - INTERVAL '90 days')
        ORDER BY "stockValue" DESC LIMIT 20
      `, [orgId]).catch(() => ({ rows: [] }))
      
      data = result.rows
      const totalValue = data.reduce((s, d) => s + Number(d.stockValue || 0), 0)
      answer = data.length > 0 
        ? 'Found ' + data.length + ' dead stock items worth KSh ' + totalValue.toLocaleString() + '. Oldest: ' + data[0].name + '.'
        : 'No dead stock detected. All inventory is moving.'
      suggestions = ['Which products will stock out?', 'What needs reordering?', 'Show overstocked items']
    }
    else if (query.includes('reorder') || query.includes('restock') || query.includes('purchase') || query.includes('buy')) {
      const result = await pool.query(`
        SELECT p.id, p.name, p.sku, COALESCE(sq.quantity, 0) as "currentStock", p."minStock", p."maxStock",
          CASE WHEN COALESCE(sq.quantity, 0) < p."minStock" THEN p."maxStock" - COALESCE(sq.quantity, 0) ELSE 0 END as "suggestedOrder"
        FROM "Product" p
        LEFT JOIN "StockQuantity" sq ON sq."productId" = p.id
        WHERE p."organizationId" = $1 
          AND COALESCE(sq.quantity, 0) < COALESCE(p."minStock", 10)
        ORDER BY "suggestedOrder" DESC LIMIT 20
      `, [orgId]).catch(() => ({ rows: [] }))
      
      data = result.rows
      answer = data.length > 0 
        ? data.length + ' products need reordering. Total suggested order: ' + data.reduce((s, d) => s + Number(d.suggestedOrder || 0), 0) + ' units.'
        : 'No reordering needed. All stock levels are healthy.'
      suggestions = ['Which products will stock out?', 'Show dead stock', 'Show overstocked items']
    }
    else if (query.includes('overstock') || query.includes('excess') || query.includes('too much')) {
      const result = await pool.query(`
        SELECT p.id, p.name, p.sku, COALESCE(sq.quantity, 0) as "currentStock", p."maxStock",
          COALESCE(sq.quantity, 0) - p."maxStock" as "excessQty"
        FROM "Product" p
        LEFT JOIN "StockQuantity" sq ON sq."productId" = p.id
        WHERE p."organizationId" = $1 
          AND COALESCE(sq.quantity, 0) > COALESCE(p."maxStock", 100) * 1.5
        ORDER BY "excessQty" DESC LIMIT 20
      `, [orgId]).catch(() => ({ rows: [] }))
      
      data = result.rows
      answer = data.length > 0 
        ? 'Found ' + data.length + ' overstocked products. Highest excess: ' + data[0].name + ' (' + data[0].excessQty + ' units over max).'
        : 'No overstock detected. Inventory levels are optimal.'
      suggestions = ['Which products will stock out?', 'Show dead stock', 'What needs reordering?']
    }
    else if (query.includes('expire') || query.includes('expiry') || query.includes('expiring')) {
      const result = await pool.query(`
        SELECT b.*, p.name as "productName" FROM "Batch" b
        JOIN "Product" p ON b."productId" = p.id
        WHERE p."organizationId" = $1 
          AND b."expiryDate" <= NOW() + INTERVAL '90 days'
          AND COALESCE(b."remainingQuantity", 0) > 0
        ORDER BY b."expiryDate" ASC LIMIT 20
      `, [orgId]).catch(() => ({ rows: [] }))
      
      data = result.rows
      answer = data.length > 0 
        ? 'Found ' + data.length + ' batches expiring within 90 days. Earliest: ' + data[0].productName + ' expiring ' + new Date(data[0].expiryDate).toLocaleDateString() + '.'
        : 'No expiring stock detected.'
      suggestions = ['Which products will stock out?', 'Show dead stock', 'What needs reordering?']
    }
    else if (query.includes('warehouse') || query.includes('location') || query.includes('storage')) {
      const result = await pool.query(`
        SELECT w.*, 
          (SELECT COALESCE(SUM(sq.quantity), 0) FROM "StockQuantity" sq JOIN "StockLocation" sl ON sq."locationId" = sl.id WHERE sl."warehouseId" = w.id) as "totalStock"
        FROM "Warehouse" w WHERE w."organizationId" = $1 ORDER BY "totalStock" DESC
      `, [orgId]).catch(() => ({ rows: [] }))
      
      data = result.rows
      answer = data.length > 0 
        ? 'Warehouse overview: ' + data.map(w => w.name + ' (' + w.totalStock + ' units)').join(', ') + '.'
        : 'No warehouses found.'
      suggestions = ['Which products will stock out?', 'Show dead stock', 'What needs reordering?']
    }
    else {
      // Default overview
      const [productCount, stockValue, lowStock, warehouseCount] = await Promise.all([
        pool.query('SELECT COUNT(*) as count FROM "Product" WHERE "organizationId" = $1', [orgId]).catch(() => ({ rows: [{ count: 0 }] })),
        pool.query('SELECT COALESCE(SUM(p."sellingPrice" * COALESCE(sq.quantity, 0)), 0) as total FROM "Product" p LEFT JOIN "StockQuantity" sq ON sq."productId" = p.id WHERE p."organizationId" = $1', [orgId]).catch(() => ({ rows: [{ total: 0 }] })),
        pool.query('SELECT COUNT(*) as count FROM "Product" p LEFT JOIN "StockQuantity" sq ON sq."productId" = p.id WHERE p."organizationId" = $1 AND COALESCE(sq.quantity, 0) < COALESCE(p."minStock", 10)', [orgId]).catch(() => ({ rows: [{ count: 0 }] })),
        pool.query('SELECT COUNT(*) as count FROM "Warehouse" WHERE "organizationId" = $1', [orgId]).catch(() => ({ rows: [{ count: 0 }] }))
      ])

      answer = 'Inventory overview: ' + productCount.rows[0].count + ' products, KSh ' + Number(stockValue.rows[0].total).toLocaleString() + ' total value, ' + lowStock.rows[0].count + ' low stock, ' + warehouseCount.rows[0].count + ' warehouses. Ask me about stockouts, dead stock, reordering, overstock, expiry, or warehouses.'
      suggestions = ['Which products will stock out?', 'Show dead stock', 'What needs reordering?', 'Show overstocked items', 'Warehouse overview']
    }

    return NextResponse.json({ answer, suggestions, data })
  } catch (error) {
    console.error('Copilot error:', error)
    return NextResponse.json({ answer: 'Unable to process query', suggestions: [], data: [] })
  }
}