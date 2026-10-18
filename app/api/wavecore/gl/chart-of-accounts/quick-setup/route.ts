export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import type { PoolClient } from 'pg'
import { requireTenant } from '@/lib/wavecore/auth'

const defaultAccounts = [
  { code: '1000', name: 'Cash', type: 'ASSET' },
  { code: '1100', name: 'Bank Account', type: 'ASSET' },
  { code: '1200', name: 'Accounts Receivable', type: 'ASSET' },
  { code: '1300', name: 'Inventory', type: 'ASSET' },
  { code: '1400', name: 'Fixed Assets', type: 'ASSET' },
  { code: '2000', name: 'Accounts Payable', type: 'LIABILITY' },
  { code: '2100', name: 'VAT Payable', type: 'LIABILITY' },
  { code: '2200', name: 'PAYE Payable', type: 'LIABILITY' },
  { code: '3000', name: 'Owner Equity', type: 'EQUITY' },
  { code: '3100', name: 'Retained Earnings', type: 'EQUITY' },
  { code: '4000', name: 'Sales Revenue', type: 'INCOME' },
  { code: '4100', name: 'Service Revenue', type: 'INCOME' },
  { code: '5000', name: 'Cost of Goods Sold', type: 'EXPENSE' },
  { code: '6000', name: 'Salaries & Wages', type: 'EXPENSE' },
  { code: '6100', name: 'Rent Expense', type: 'EXPENSE' },
  { code: '6200', name: 'Utilities', type: 'EXPENSE' },
  { code: '6300', name: 'Marketing', type: 'EXPENSE' },
  { code: '6400', name: 'Office Supplies', type: 'EXPENSE' },
]

export async function POST(request: NextRequest) {
  let client: PoolClient | null = null

  try {
    // 1) Auth first — before touching the DB pool
    const session = await requireTenant(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const orgId = session.organizationId

    // 2) Only now grab a connection
    client = await pool.connect()

    await client.query('BEGIN')
    let created = 0

    for (const account of defaultAccounts) {
      const existing = await client.query(
        'SELECT id FROM "ChartOfAccount" WHERE code = $1 AND "organizationId" = $2',
        [account.code, orgId]
      )
      if (existing.rows.length === 0) {
        await client.query(
          'INSERT INTO "ChartOfAccount" (id, code, name, type, "isActive", "organizationId", "createdAt", "updatedAt") VALUES (gen_random_uuid()::text, $1, $2, $3, true, $4, NOW(), NOW())',
          [account.code, account.name, account.type, orgId]
        )
        created++
      }
    }

    await client.query('COMMIT')
    return NextResponse.json({ success: true, created }, { status: 201 })
  } catch (error: any) {
    // Safe rollback — never throws
    if (client) {
      try { await client.query('ROLLBACK') } catch { /* swallow */ }
    }
    console.error('Quick setup error:', error)
    const message =
      process.env.NODE_ENV === 'development'
        ? `Internal server error: ${error?.message || String(error)}`
        : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  } finally {
    if (client) {
      try { client.release() } catch { /* swallow */ }
    }
  }
}