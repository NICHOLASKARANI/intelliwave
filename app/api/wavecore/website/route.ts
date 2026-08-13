export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant()
    const orgId = session.organizationId

    const productCount = await pool.query(
      'SELECT COUNT(*) FROM "Product" WHERE "organizationId" = $1',
      [orgId]
    )

    const customerCount = await pool.query(
      'SELECT COUNT(*) FROM "Customer" WHERE "organizationId" = $1',
      [orgId]
    )

    const invoiceCount = await pool.query(
      'SELECT COUNT(*) FROM "CustomerInvoice" WHERE "organizationId" = $1',
      [orgId]
    )

    return NextResponse.json({
      store: {
        products: parseInt(productCount.rows[0].count),
        customers: parseInt(customerCount.rows[0].count),
        invoices: parseInt(invoiceCount.rows[0].count),
      },
    })
  } catch (error) {
    console.error('Website GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}