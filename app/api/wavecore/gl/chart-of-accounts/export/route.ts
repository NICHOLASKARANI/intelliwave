export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    const orgId = session.organizationId

    const result = await pool.query(
      `SELECT code, name, type, description, "isActive"
       FROM "ChartOfAccount"
       WHERE "organizationId" = $1
       ORDER BY code ASC`,
      [orgId]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'No accounts to export' }, { status: 404 })
    }

    const escapeCell = (v: any) => {
      if (v === null || v === undefined) return ''
      const s = String(v)
      if (s.includes(',') || s.includes('"') || s.includes('\n')) {
        return `"${s.replace(/"/g, '""')}"`
      }
      return s
    }

    const headers = ['Code', 'Name', 'Type', 'Description', 'Active']
    const csvLines = [
      headers.join(','),
      ...result.rows.map(row => [
        escapeCell(row.code),
        escapeCell(row.name),
        escapeCell(row.type),
        escapeCell(row.description),
        escapeCell(row.isActive),
      ].join(',')),
    ]

    const csv = csvLines.join('\n')

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="chart-of-accounts.csv"',
      },
    })
  } catch (error) {
    console.error('Accounts export error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}