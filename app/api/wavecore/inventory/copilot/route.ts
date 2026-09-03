export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/wavecore/auth'
import { pool } from '@/lib/wavecore/db'

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const orgId = session.organizationId
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('query')?.toLowerCase() || ''

    // Generate insights based on query
    if (query.includes('stockout') || query.includes('stock out') || query.includes('shortage')) {
      const result = await pool.query(`
        SELECT p.id, p.name, p.sku, COALESCE(sq.quantity, 0) as "currentStock", p."minStock"
        FROM "Product" p
        LEFT JOIN "StockQuantity" sq ON sq."productId" = p.id
        WHERE p."organizationId" = $1 AND COALESCE(sq.quantity, 0) < COALESCE(p."minStock", 10)
        ORDER BY COALESCE(sq.quantity, 0) ASC
        LIMIT 10
      `, [orgId]).catch(() => ({ rows: [] }))
      
      return NextResponse.json({
        answer: `Found ${result.rows.length} products at risk of stockout.`,
        details: result.rows,
        citations: result.rows.map(r => `/wavecore-erp/inventory?product=${r.id}`)
      })
    }

    if (query.includes('dead stock') || query.includes('slow moving') || query.includes('slow-moving')) {
      const result = await pool.query(`
        SELECT p.id, p.name, p.sku, COALESCE(sq.quantity, 0) as "currentStock",
          p."costPrice" * COALESCE(sq.quantity, 0) as "stockValue"
        FROM "Product" p
        LEFT JOIN "StockQuantity" sq ON sq."productId" = p.id
        WHERE p."organizationId" = $1 AND COALESCE(sq.quantity, 0) > 0
          AND p.id NOT IN (
            SELECT DISTINCT sm."productId" FROM "StockMove" sm 
            WHERE sm."organizationId" = $1 AND sm."createdAt" > NOW() - INTERVAL '90 days'
          )
        ORDER BY "stockValue" DESC
        LIMIT 10
      `, [orgId]).catch(() => ({ rows: [] }))
      
      return NextResponse.json({
        answer: `Found ${result.rows.length} dead stock items worth KSh ${result.rows.reduce((sum, r) => sum + Number(r.stockValue || 0), 0).toLocaleString()}.`,
        details: result.rows,
        citations: result.rows.map(r => `/wavecore-erp/inventory?product=${r.id}`)
      })
    }

    if (query.includes('expiry') || query.includes('expiring') || query.includes('expire')) {
      const result = await pool.query(`
        SELECT b.*, p.name as "productName"
        FROM "Batch" b
        JOIN "Product" p ON b."productId" = p.id
        WHERE p."organizationId" = $1 
          AND b."expiryDate" <= NOW() + INTERVAL '90 days'
          AND b."remainingQuantity" > 0
        ORDER BY b."expiryDate" ASC
        LIMIT 10
      `, [orgId]).catch(() => ({ rows: [] }))
      
      return NextResponse.json({
        answer: `Found ${result.rows.length} batches expiring within 90 days.`,
        details: result.rows,
        citations: result.rows.map(r => `/wavecore-erp/inventory?batch=${r.id}`)
      })
    }

    if (query.includes('overstock') || query.includes('excess') || query.includes('too much')) {
      const result = await pool.query(`
        SELECT p.id, p.name, p.sku, COALESCE(sq.quantity, 0) as "currentStock", p."maxStock"
        FROM "Product" p
        LEFT JOIN "StockQuantity" sq ON sq."productId" = p.id
        WHERE p."organizationId" = $1 
          AND COALESCE(sq.quantity, 0) > COALESCE(p."maxStock", 100) * 1.5
        ORDER BY COALESCE(sq.quantity, 0) DESC
        LIMIT 10
      `, [orgId]).catch(() => ({ rows: [] }))
      
      return NextResponse.json({
        answer: `Found ${result.rows.length} overstocked products.`,
        details: result.rows,
        citations: result.rows.map(r => `/wavecore-erp/inventory?product=${r.id}`)
      })
    }

    if (query.includes('warehouse') || query.includes('storage')) {
      const result = await pool.query(`
        SELECT w.id, w.name, w.code,
          (SELECT COALESCE(SUM(sq.quantity), 0) FROM "StockQuantity" sq 
           JOIN "StockLocation" sl ON sq."locationId" = sl.id WHERE sl."warehouseId" = w.id) as "totalStock"
        FROM "Warehouse" w
        WHERE w."organizationId" = $1
        ORDER BY "totalStock" DESC
      `, [orgId]).catch(() => ({ rows: [] }))
      
      return NextResponse.json({
        answer: `Warehouse inventory overview:`,
        details: result.rows,
        citations: result.rows.map(r => `/wavecore-erp/inventory?warehouse=${r.id}`)
      })
    }

    // Default response
    const overview = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM "Product" WHERE "organizationId" = $1) as "totalProducts",
        (SELECT COALESCE(SUM(p."sellingPrice" * COALESCE(sq.quantity, 0)), 0) FROM "Product" p LEFT JOIN "StockQuantity" sq ON sq."productId" = p.id WHERE p."organizationId" = $1) as "inventoryValue",
        (SELECT COUNT(*) FROM "Product" p LEFT JOIN "StockQuantity" sq ON sq."productId" = p.id WHERE p."organizationId" = $1 AND COALESCE(sq.quantity, 0) < COALESCE(p."minStock", 10)) as "lowStock",
        (SELECT COUNT(*) FROM "Warehouse" WHERE "organizationId" = $1) as "warehouses"
    `, [orgId]).catch(() => ({ rows: [{ totalProducts: 0, inventoryValue: 0, lowStock: 0, warehouses: 0 }] }))

    const stats = overview.rows[0]

    return NextResponse.json({
      answer: `Inventory overview: ${stats.totalProducts} products, KSh ${Number(stats.inventoryValue).toLocaleString()} total value, ${stats.lowStock} low stock items, ${stats.warehouses} warehouses. Ask me about stockouts, dead stock, expiry, overstock, or warehouses.`,
      suggestions: [
        'Which products will stock out soon?',
        'Show me dead stock',
        'What is expiring soon?',
        'Which products are overstocked?',
        'Show warehouse overview'
      ]
    })
  } catch (error) {
    console.error('Copilot error:', error)
    return NextResponse.json({ answer: 'Unable to process query', suggestions: [] })
  }
}