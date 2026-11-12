export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

export async function GET(req: NextRequest) {
  try {
    const session = await requireTenant(req)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const res = await pool.query(
      `SELECT "paymentPaybill", "paymentPaybillAccount", "paymentTill", "paymentPersonal",
              "preferredPaymentMethod", "mpesaNumber"
       FROM "SellerProfile" WHERE "userId" = $1`,
      [session.userId]
    )
    if (res.rows.length === 0) return NextResponse.json({ settings: null })
    return NextResponse.json({ settings: res.rows[0] })
  } catch (error: any) {
    console.error('Payment settings GET error:', error?.message)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await requireTenant(req)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json().catch(() => ({}))
    const method = String(body.preferredPaymentMethod || '').toUpperCase()
    if (!['PAYBILL', 'TILL', 'PERSONAL'].includes(method)) {
      return NextResponse.json({ error: 'Invalid payment method' }, { status: 400 })
    }

    const sets: string[] = ['"preferredPaymentMethod" = $1']
    const values: any[] = [method]
    let i = 2

    if (method === 'PAYBILL') {
      const pb = (body.paymentPaybill || '').toString().trim().replace(/\D/g, '').slice(0, 10)
      const pa = (body.paymentPaybillAccount || '').toString().trim().slice(0, 20)
      if (!pb) return NextResponse.json({ error: 'Paybill number required' }, { status: 400 })
      sets.push(`"paymentPaybill" = $${i++}`); values.push(pb)
      sets.push(`"paymentPaybillAccount" = $${i++}`); values.push(pa || null)
    } else if (method === 'TILL') {
      const till = (body.paymentTill || '').toString().trim().replace(/\D/g, '').slice(0, 10)
      if (!till) return NextResponse.json({ error: 'Till number required' }, { status: 400 })
      sets.push(`"paymentTill" = $${i++}`); values.push(till)
    } else if (method === 'PERSONAL') {
      const p = (body.paymentPersonal || '').toString().trim().replace(/\D/g, '')
      if (!/^(?:254|0)?[17]\d{8}$/.test(p)) return NextResponse.json({ error: 'Invalid phone' }, { status: 400 })
      sets.push(`"paymentPersonal" = $${i++}`); values.push(p)
    }

    sets.push(`"updatedAt" = NOW()`)
    values.push(session.userId)

    await pool.query(
      `UPDATE "SellerProfile" SET ${sets.join(', ')} WHERE "userId" = $${i}`,
      values
    )

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Payment settings PUT error:', error?.message)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}