export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'
import { guardHR } from '@/lib/wavecore/guard'

async function getOrCreateWallet(userId: string, organizationId: string): Promise<any> {
  const existing = await pool.query(`SELECT * FROM "SellerWallet" WHERE "sellerId" = $1`, [userId])
  if (existing.rows.length > 0) return existing.rows[0]

  const crypto = require('crypto')
  const id = crypto.randomUUID()
  await pool.query(
    `INSERT INTO "SellerWallet" (id, "sellerId", "organizationId", "createdAt", "updatedAt")
     VALUES ($1,$2,$3,NOW(),NOW())`,
    [id, userId, organizationId]
  )
  const created = await pool.query(`SELECT * FROM "SellerWallet" WHERE id = $1`, [id])
  return created.rows[0]
}

// GET: Wallet summary + recent transactions
export async function GET(req: NextRequest) {
  try {
    const session = await requireTenant(req)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const guard = await guardHR(req, 'HR_READ')
    if (guard.deny) return guard.response!

    const { searchParams } = new URL(req.url)
    const includeTx = searchParams.get('transactions') !== 'false'

    const wallet = await getOrCreateWallet(session.userId, session.organizationId)

    // Transactions
    let transactions: any[] = []
    if (includeTx) {
      const txRes = await pool.query(
        `SELECT * FROM "WalletTransaction" WHERE "sellerId" = $1 ORDER BY "createdAt" DESC LIMIT 100`,
        [session.userId]
      )
      transactions = txRes.rows
    }

    // Aggregates
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayRes = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) AS today_total
       FROM "WalletTransaction"
       WHERE "sellerId" = $1 AND type IN ('SALE_SETTLED','SALE_PENDING') AND "createdAt" >= $2`,
      [session.userId, today.toISOString()]
    )

    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
    const monthRes = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) AS month_total
       FROM "WalletTransaction"
       WHERE "sellerId" = $1 AND type IN ('SALE_SETTLED','SALE_PENDING') AND "createdAt" >= $2`,
      [session.userId, monthStart.toISOString()]
    )

    return NextResponse.json({
      wallet,
      summary: {
        availableBalance: Number(wallet.availableBalance || 0),
        pendingBalance: Number(wallet.pendingBalance || 0),
        reserveBalance: Number(wallet.reserveBalance || 0),
        lifetimeEarnings: Number(wallet.lifetimeEarnings || 0),
        lifetimeCommission: Number(wallet.lifetimeCommission || 0),
        todaySales: Number(todayRes.rows[0]?.today_total || 0),
        monthSales: Number(monthRes.rows[0]?.month_total || 0),
        currency: wallet.currency || 'KES',
      },
      transactions,
    })
  } catch (error) {
    console.error('Wallet GET error:', error)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}

// POST: Request a payout (moves available balance to payout queue)
export async function POST(req: NextRequest) {
  try {
    const session = await requireTenant(req)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const guard = await guardHR(req, 'HR_WRITE')
    if (guard.deny) return guard.response!

    const body = await req.json()
    const amount = Number(body.amount || 0)
    if (amount <= 0) return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })

    const wallet = await getOrCreateWallet(session.userId, session.organizationId)
    const available = Number(wallet.availableBalance || 0)
    if (amount > available) return NextResponse.json({ error: 'Insufficient available balance' }, { status: 400 })

    const crypto = require('crypto')
    const txId = crypto.randomUUID()
    const newBalance = available - amount

    await pool.query(
      `UPDATE "SellerWallet" SET "availableBalance" = $1, "lastPayoutAt" = NOW(), "updatedAt" = NOW() WHERE id = $2`,
      [Math.round(newBalance * 100) / 100, wallet.id]
    )

    await pool.query(
      `INSERT INTO "WalletTransaction" (id, "sellerId", "walletId", type, amount, balance, description, status, "createdAt")
       VALUES ($1,$2,$3,'PAYOUT_REQUEST',$4,$5,$6,'PENDING',NOW())`,
      [
        txId, session.userId, wallet.id,
        -Math.round(amount * 100) / 100,
        Math.round(newBalance * 100) / 100,
        `Payout request — KES ${amount.toLocaleString()}`,
      ]
    )

    return NextResponse.json({
      success: true,
      amount,
      newBalance: Math.round(newBalance * 100) / 100,
      message: 'Payout request submitted. Funds typically settle in 3-5 business days.',
    })
  } catch (error) {
    console.error('Wallet POST error:', error)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}