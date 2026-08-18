export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    const orgId = session.organizationId

    const result = await pool.query(
      `SELECT je.number, je.date, je.reference, je.description, je.status, je.amount,
              ji.description as line_description, ji.debit, ji.credit,
              coa.code as account_code, coa.name as account_name
       FROM "JournalEntry" je
       JOIN "JournalItem" ji ON ji."journalEntryId" = je.id
       JOIN "ChartOfAccount" coa ON coa.id = ji."accountId"
       WHERE je."organizationId" = $1
       ORDER BY je.date DESC, je.number ASC`,
      [orgId]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'No journal entries to export' }, { status: 404 })
    }

    const headers = ['Number', 'Date', 'Reference', 'Description', 'Status', 'Amount', 'Line Description', 'Debit', 'Credit', 'Account Code', 'Account Name']
    const escapeCell = (v: any) => {
      if (v === null || v === undefined) return ''
      const s = String(v)
      if (s.includes(',') || s.includes('"') || s.includes('\n')) {
        return `"${s.replace(/"/g, '""')}"`
      }
      return s
    }

    const csvLines = [
      headers.join(','),
      ...result.rows.map(row => headers.map(h => {
        const map: Record<string, string> = {
          'Number': row.number,
          'Date': new Date(row.date).toISOString().split('T')[0],
          'Reference': row.reference || '',
          'Description': row.description,
          'Status': row.status,
          'Amount': String(row.amount),
          'Line Description': row.line_description || '',
          'Debit': String(row.debit),
          'Credit': String(row.credit),
          'Account Code': row.account_code,
          'Account Name': row.account_name,
        }
        return escapeCell(map[h])
      }).join(',')),
    ]

    const csv = csvLines.join('\n')

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="journal-entries.csv"',
      },
    })
  } catch (error) {
    console.error('Journal export error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}