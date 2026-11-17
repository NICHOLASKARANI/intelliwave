export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'
import { generateCSV, parseCSV } from '@/lib/wavecore/csv'

// GET - Export Chart of Accounts
export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    const orgId = session!.organizationId

    const { searchParams } = new URL(request.url)
    const entity = searchParams.get('entity') || 'accounts'

    if (entity === 'accounts') {
      const result = await pool.query(
        `SELECT code, name, type, description FROM "ChartOfAccount" WHERE "organizationId" = $1 ORDER BY code`,
        [orgId]
      )

      if (result.rows.length === 0) {
        return NextResponse.json({ error: 'No accounts to export' }, { status: 404 })
      }

      const headers = ['code', 'name', 'type', 'description']
      const rows = result.rows.map(r => [r.code, r.name, r.type, r.description || ''])
      const csv = generateCSV(headers, rows)

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="chart-of-accounts.csv"`,
        },
      })
    }

    return NextResponse.json({ error: 'Invalid export entity' }, { status: 400 })
  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Import Chart of Accounts
export async function POST(request: NextRequest) {
  const client = await pool.connect()
  try {
    const session = await requireTenant(request)
    const orgId = session!.organizationId

    const body = await request.json()
    const { csvText } = body

    if (!csvText) {
      return NextResponse.json({ error: 'CSV data required' }, { status: 400 })
    }

    const { headers, rows } = parseCSV(csvText)

    // Validate required columns
    const requiredCols = ['code', 'name', 'type']
    for (const col of requiredCols) {
      if (!headers.includes(col)) {
        return NextResponse.json({ error: `Missing required column: ${col}` }, { status: 422 })
      }
    }

    let imported = 0
    let skipped = 0
    const errors: string[] = []

    await client.query('BEGIN')

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const data: Record<string, string> = {}
      headers.forEach((h, idx) => { data[h] = row[idx] || '' })

      if (!data.code || !data.name || !data.type) {
        skipped++
        errors.push(`Row ${i + 2}: Missing required fields`)
        continue
      }

      // Validate type
      const validTypes = ['ASSET', 'LIABILITY', 'EQUITY', 'INCOME', 'EXPENSE']
      if (!validTypes.includes(data.type)) {
        skipped++
        errors.push(`Row ${i + 2}: Invalid type "${data.type}"`)
        continue
      }

      // Check duplicate code
      const existing = await client.query(
        'SELECT id FROM "ChartOfAccount" WHERE code = $1 AND "organizationId" = $2',
        [data.code, orgId]
      )
      if (existing.rows.length > 0) {
        skipped++
        errors.push(`Row ${i + 2}: Account code ${data.code} already exists`)
        continue
      }

      await client.query(
        `INSERT INTO "ChartOfAccount" (id, code, name, type, description, "isActive", "organizationId", "createdAt", "updatedAt")
         VALUES (gen_random_uuid()::text, $1, $2, $3, $4, true, $5, NOW(), NOW())`,
        [data.code, data.name, data.type, data.description || null, orgId]
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
    console.error('Import error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  } finally {
    client.release()
  }
}