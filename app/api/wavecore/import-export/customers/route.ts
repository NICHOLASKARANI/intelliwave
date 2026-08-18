export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'
import { generateCSV, parseCSV, validateCSV } from '@/lib/wavecore/csv'

// GET - Export customers as CSV
export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)

    const result = await pool.query(
      `SELECT name, email, phone, company, address, city, country, type, status
       FROM "Customer"
       WHERE "organizationId" = $1
       ORDER BY "createdAt" DESC`,
      [session.organizationId]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'No customers to export' }, { status: 404 })
    }

    const headers = Object.keys(result.rows[0])
    const rows = result.rows.map(row => headers.map(h => row[h]))

    const csv = generateCSV(headers, rows)

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="customers-${session.organizationId}.csv"`,
      },
    })
  } catch (error) {
    console.error('Customers export error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Import customers from CSV
export async function POST(request: NextRequest) {
  const client = await pool.connect()
  try {
    const session = await requireTenant(request)

    const body = await request.json()
    const { csvText } = body

    if (!csvText) {
      return NextResponse.json({ error: 'CSV data required' }, { status: 400 })
    }

    const { headers, rows } = parseCSV(csvText)
    const requiredColumns = ['name']
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

      if (!rowData.name) {
        skipped++
        errors.push(`Row ${i + 2}: Missing name`)
        continue
      }

      // Skip if email already exists for this org
      if (rowData.email) {
        const existing = await client.query(
          'SELECT id FROM "Customer" WHERE email = $1 AND "organizationId" = $2',
          [rowData.email, session.organizationId]
        )
        if (existing.rows.length > 0) {
          skipped++
          errors.push(`Row ${i + 2}: Email ${rowData.email} already exists`)
          continue
        }
      }

      await client.query(
        `INSERT INTO "Customer" (id, name, email, phone, company, address, city, country, type, status, "organizationId", "createdAt", "updatedAt")
         VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())`,
        [
          rowData.name,
          rowData.email || null,
          rowData.phone || null,
          rowData.company || null,
          rowData.address || null,
          rowData.city || null,
          rowData.country || null,
          rowData.type || 'INDIVIDUAL',
          rowData.status || 'ACTIVE',
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
    console.error('Customers import error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  } finally {
    client.release()
  }
}