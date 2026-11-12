export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

// GET: minimal public info about seller's payment details (only paybill/till/personal - no other PII)
export async function GET(req: NextRequest, { params }: { params: { sellerId: string } }) {
  try {
    const session = await requireTenant(req)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const res = await pool.query(
      `SELECT "preferredPaymentMethod", "paymentPaybill", "paymentPaybillAccount",
              "paymentTill", "paymentPersonal", "storeName"
       FROM "SellerProfile" WHERE "userId" = $1`,
      [params.sellerId]
    )
    if (res.rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    return NextResponse.json(res.rows[0])
  } catch (error: any) {
    console.error('Seller payment info error:', error?.message)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}