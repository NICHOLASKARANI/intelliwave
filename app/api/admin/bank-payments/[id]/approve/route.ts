import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const PLAN_DAYS: Record<string, number> = {
  MONTHLY: 30,
  QUARTERLY: 90,
  HALF_YEARLY: 180,
  YEARLY: 365,
}

function isAuthorized(req: NextRequest): boolean {
  const cookie = req.cookies.get('wavecore_role')?.value
  const adminPassword = req.headers.get('x-admin-password')
  const envPassword = process.env.NUCLEAR_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD
  if (adminPassword && envPassword && adminPassword === envPassword) return true
  if (cookie === 'OWNER' || cookie === 'TENANT_ADMIN') return true
  return false
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // ─── Fetch pending payment (before approval, for atomicity) ───
    const pending = await pool.query(
      `SELECT p.id, p."userId", p."planId", p.amount, p."txnReference", p.status,
              u."organizationId", u.email
       FROM "PendingBankPayment" p
       LEFT JOIN "User" u ON u.id = p."userId"
       WHERE p.id = $1 LIMIT 1`,
      [params.id]
    )

    if (pending.rowCount === 0) {
      return NextResponse.json({ error: 'Pending payment not found' }, { status: 404 })
    }

    const p = pending.rows[0]
    if (p.status === 'APPROVED') {
      return NextResponse.json({ error: 'Already approved' }, { status: 400 })
    }
    if (!p.organizationId) {
      return NextResponse.json({ error: 'Pending payment has no linked user/org' }, { status: 400 })
    }

    // ─── Mark payment as APPROVED ───
    await pool.query(
      `UPDATE "PendingBankPayment"
       SET status = 'APPROVED', "approvedBy" = 'CEO', "approvedAt" = NOW(), "updatedAt" = NOW()
       WHERE id = $1`,
      [params.id]
    )

    // ─── Activate subscription (identical logic to M-Pesa callback) ───
    const planId = (p.planId || 'MONTHLY').toUpperCase()
    const daysToAdd = PLAN_DAYS[planId] || 30
    const amount = Number(p.amount) || 500
    const txnRef = String(p.txnReference)

    const existing = await pool.query(
      `SELECT id, "endDate", status FROM "Subscription"
       WHERE "organizationId" = $1 ORDER BY "createdAt" DESC LIMIT 1`,
      [p.organizationId]
    )

    const now = new Date()
    let baseDate = now
    if (existing.rowCount! > 0 && existing.rows[0].endDate) {
      const prevEnd = new Date(existing.rows[0].endDate)
      baseDate = prevEnd > now ? prevEnd : now
    }
    const newEnd = new Date(baseDate)
    newEnd.setDate(newEnd.getDate() + daysToAdd)

    if (existing.rowCount! > 0) {
      await pool.query(
        `UPDATE "Subscription"
         SET plan = $1, status = 'ACTIVE', amount = $2, "mpesaReceipt" = $3,
             "endDate" = $4, "nextBillingAt" = $4, "updatedAt" = NOW()
         WHERE id = $5`,
        [planId, amount, txnRef, newEnd, existing.rows[0].id]
      )
    } else {
      const crypto = require('crypto')
      await pool.query(
        `INSERT INTO "Subscription"
          (id, plan, status, amount, currency, "startDate", "endDate", "nextBillingAt",
           "mpesaReceipt", "userId", "organizationId", "createdAt", "updatedAt")
         VALUES ($1, $2, 'ACTIVE', $3, 'KES', NOW(), $4, $4, $5, $6, $7, NOW(), NOW())`,
        [crypto.randomUUID(), planId, amount, newEnd, txnRef, p.userId, p.organizationId]
      )
    }

    // ─── Audit ───
    await pool.query(
      `INSERT INTO "AuditLog" (id, action, "entityType", "entityId", "organizationId", "userId", "createdAt")
       VALUES (gen_random_uuid()::text, 'BANK_PAYMENT_APPROVED', 'Subscription', $1, $2, $3, NOW())`,
      [p.txnReference, p.organizationId, p.userId]
    ).catch(() => {})

    return NextResponse.json({
      ok: true,
      approved: true,
      planId,
      amount,
      daysAdded: daysToAdd,
      subscriptionEndDate: newEnd.toISOString(),
      message: 'Payment approved. Subscription activated.',
    })
  } catch (err) {
    console.error('[bank-approve] error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}