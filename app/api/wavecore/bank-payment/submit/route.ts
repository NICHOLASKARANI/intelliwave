import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const ALLOWED_PLANS: Record<string, { amount: number; days: number }> = {
  MONTHLY: { amount: 500, days: 30 },
  QUARTERLY: { amount: 1350, days: 90 },
  HALF_YEARLY: { amount: 2750, days: 180 },
  YEARLY: { amount: 5000, days: 365 },
}

export async function POST(req: NextRequest) {
  try {
    // ─── Auth gate (same as M-Pesa STK) ───
    const session = await requireTenant(req)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // ─── Parse + validate body ───
    const body = await req.json().catch(() => ({}))
    const txnReference = String(body.txnReference || '').trim()
    const planId = String(body.planId || '').trim().toUpperCase()

    if (!txnReference || txnReference.length < 6 || txnReference.length > 64) {
      return NextResponse.json({ error: 'Transaction reference must be 6–64 characters' }, { status: 400 })
    }
    if (!/^[A-Za-z0-9\-_]+$/.test(txnReference)) {
      return NextResponse.json({ error: 'Transaction reference contains invalid characters' }, { status: 400 })
    }

    const plan = ALLOWED_PLANS[planId]
    if (!plan) {
      return NextResponse.json({ error: 'Invalid plan. Choose: ' + Object.keys(ALLOWED_PLANS).join(', ') }, { status: 400 })
    }

    // ─── Check for duplicate reference (prevents double-claim) ───
    const existing = await pool.query(
      `SELECT id, "organizationId", status FROM "PendingBankPayment" WHERE "txnReference" = $1 LIMIT 1`,
      [txnReference]
    )
    if (existing.rowCount! > 0) {
      // If reference exists but belongs to another org → reject
      if (existing.rows[0].organizationId !== session.organizationId) {
        return NextResponse.json({ error: 'This reference has already been used' }, { status: 409 })
      }
      // Same org, same reference → return the existing record (idempotent)
      return NextResponse.json({
        ok: true,
        pendingId: existing.rows[0].id,
        status: existing.rows[0].status,
        message: 'This reference was already submitted',
        isDuplicate: true,
      })
    }

    // ─── Capture IP for audit ───
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
               req.headers.get('x-real-ip') ||
               'unknown'

    // ─── Get user email for admin reference ───
    const userLookup = await pool.query(
      `SELECT email, name FROM "User" WHERE id = $1 LIMIT 1`,
      [session.userId]
    )
    const email = userLookup.rows[0]?.email || null
    const payerName = userLookup.rows[0]?.name || null

    // ─── Insert pending payment (status PENDING) ───
    const crypto = require('crypto')
    const id = crypto.randomUUID()

    await pool.query(
      `INSERT INTO "PendingBankPayment"
        (id, "userId", email, "planId", amount, currency, "txnReference",
         "payerName", status, "ipAddress", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, 'KES', $6, $7, 'PENDING', $8, NOW(), NOW())`,
      [id, session.userId, email, planId, plan.amount, txnReference, payerName, ip]
    )

    // ─── Audit log ───
    await pool.query(
      `INSERT INTO "AuditLog" (id, action, "entityType", "entityId", "organizationId", "userId", "createdAt")
       VALUES (gen_random_uuid()::text, 'BANK_PAYMENT_SUBMITTED', 'PendingBankPayment', $1, $2, $3, NOW())`,
      [id, session.organizationId, session.userId]
    ).catch(() => {})

    return NextResponse.json({
      ok: true,
      pendingId: id,
      status: 'PENDING',
      plan: planId,
      amount: plan.amount,
      message: 'Submitted. CEO will verify and approve within 10 minutes. Call 0714694493 if urgent.',
    }, { status: 201 })
  } catch (err) {
    console.error('[bank-payment/submit] error:', err)
    return NextResponse.json({ error: 'Server error. Please try again.' }, { status: 500 })
  }
}