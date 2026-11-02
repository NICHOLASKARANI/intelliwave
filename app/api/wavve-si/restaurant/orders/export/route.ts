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
      `SELECT so.number, so.date, so.status, so.subtotal, so."taxAmount", so.total,
              c.name AS customer_name, c.email AS customer_email,
              (SELECT COUNT(*) FROM "SalesOrderItem" soi WHERE soi."salesOrderId" = so.id) AS item_count
       FROM "SalesOrder" so
       LEFT JOIN "Customer" c ON c.id = so."customerId"
       WHERE so."organizationId" = $1
       ORDER BY so.date DESC`,
      [session.organizationId]
    )

    const headers = ['Order Number', 'Date', 'Status', 'Customer', 'Customer Email', 'Items', 'Subtotal (KSh)', 'Tax (KSh)', 'Total (KSh)']
    const rows = result.rows.map(r => [
      r.number,
      new Date(r.date).toISOString().slice(0, 10),
      r.status,
      r.customer_name || '',
      r.customer_email || '',
      r.item_count,
      Number(r.subtotal).toFixed(2),
      Number(r.taxAmount).toFixed(2),
      Number(r.total).toFixed(2),
    ])

    const csv = rowsToCsv(headers, rows)
    return csvResponse(csv, `orders-${todayStamp()}.csv`) as any
  } catch (err: any) {
    console.error('[orders/export] error:', err?.message)
    return NextResponse.json({ error: 'Failed to export orders' }, { status: 500 })
  }
}