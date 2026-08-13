export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'
import { generateCSV, parseCSV, validateCSV } from '@/lib/wavecore/csv'

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant()

    const result = await pool.query(
      `SELECT name, sku, barcode, description, category, unit, "costPrice", "sellingPrice", "minStock", "maxStock"
       FROM "Product"
       WHERE "organizationId" = $1
       ORDER BY "createdAt" DESC`,
      [session.organizationId]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'No products to export' }, { status: 404 })
    }

    const headers = Object.keys(result.rows[0])
    const rows = result.rows.map(row => headers.map(h => row[h]))
    const csv = generateCSV(headers, rows)

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="products-${session.organizationId}.csv"`,
      },
    })
  } catch (error) {
    console.error('Products export error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const client = await pool.connect()
  try {
    const session = await requireTenant()

    const body = await request.json()
    const { csvText } = body

    if (!csvText) {
      return NextResponse.json({ error: 'CSV data required' }, { status: 400 })
    }

    const { headers, rows } = parseCSV(csvText)
    const requiredColumns = ['name', 'sku']
    const validation = validateCSV(headers, rows, requiredColumns)

    if (!validation.valid) {
      return NextResponse.json({ error: 'CSV validation failed', details: validation.errors }, { status: 422 })
    }

    let imported = 0
    let skipped = 0
    const errors: string[] = []

    await client.query('BEGIN')

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const rowData: Record<string, any> = {}
      headers.forEach((header, index) => {
        rowData[header] = row[index] || null
      })

      if (!rowData.name || !rowData.sku) {
        skipped++
        continue
      }

      // Check SKU uniqueness within org
      const existing = await client.query(
        'SELECT id FROM "Product" WHERE sku = $1 AND "organizationId" = $2',
        [rowData.sku, session.organizationId]
      )
      if (existing.rows.length > 0) {
        skipped++
        errors.push(`Row ${i + 2}: SKU ${rowData.sku} already exists`)
        continue
      }

      await client.query(
        `INSERT INTO "Product" (id, name, sku, barcode, description, category, unit, "costPrice", "sellingPrice", "minStock", "maxStock", "organizationId", "createdAt", "updatedAt")
         VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())`,
        [
          rowData.name,
          rowData.sku,
          rowData.barcode || null,
          rowData.description || null,
          rowData.category || null,
          rowData.unit || 'Unit',
          parseFloat(rowData.costPrice) || 0,
          parseFloat(rowData.sellingPrice) || 0,
          parseFloat(rowData.minStock) || 0,
          parseFloat(rowData.maxStock) || 0,
          session.organizationId,
        ]
      )
      imported++
    }

    await client.query('COMMIT')

    return NextResponse.json({
      success: true,
      imported,
      skipped,
      errors: errors.slice(0, 20),
    }, { status: 201 })
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('Products import error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  } finally {
    client.release()
  }
}