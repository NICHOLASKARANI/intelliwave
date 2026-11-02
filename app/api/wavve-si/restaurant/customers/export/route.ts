export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/wavecore/auth'
import { pool } from '@/lib/wavecore/db'
import { rowsToCsv, csvResponse, todayStamp } from '@/lib/wavve-si/csv'

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const result = await pool.query(
      `SELECT name, email, phone, company, city, country, status, "createdAt"
       FROM "Customer"
       WHERE "organizationId" = $1
       ORDER BY "createdAt" DESC`,
      [session.organizationId]
    )

    const headers = ['Name', 'Email', 'Phone', 'Company', 'City', 'Country', 'Status', 'Created']
    const rows = result.rows.map(r => [
      r.name,
      r.email || '',
      r.phone || '',
      r.company || '',
      r.city || '',
      r.country || '',
      r.status,
      new Date(r.createdAt).toISOString().slice(0, 10),
    ])

    const csv = rowsToCsv(headers, rows)
    return csvResponse(csv, `customers-${todayStamp()}.csv`) as any
  } catch (err: any) {
    console.error('[customers/export] error:', err?.message)
    return NextResponse.json({ error: 'Failed to export customers' }, { status: 500 })
  }
}