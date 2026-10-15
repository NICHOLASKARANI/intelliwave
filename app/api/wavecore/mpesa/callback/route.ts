export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'

// ============================================================
// M-Pesa Daraja — Callback handler
// Safaricom POSTs here after the customer enters their PIN.
// Must always respond with 200 + { ResponseCode: "0" } to stop retries.
// ============================================================

export async function POST(req: NextRequest) {
  let body: any = null
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ResultCode: 1, ResultDesc: 'Invalid JSON' }, { status: 200 })
  }

  try {
    const stkCallback = body?.Body?.stkCallback
    if (!stkCallback) {
      return NextResponse.json({ ResultCode: 1, ResultDesc: 'Missing stkCallback' }, { status: 200 })
    }

    const resultCode = Number(stkCallback.ResultCode)
    const resultDesc = String(stkCallback.ResultDesc || '')
    const merchantRequestId = String(stkCallback.MerchantRequestID || '')
    const checkoutRequestId = String(stkCallback.CheckoutRequestID || '')

    // Extract metadata (only present on success)
    let mpesaReceipt: string | null = null
    let amount: number | null = null
    let phoneNumber: string | null = null

    if (Array.isArray(stkCallback.CallbackMetadata?.Item)) {
      for (const item of stkCallback.CallbackMetadata.Item) {
        if (item.Name === 'MpesaReceiptNumber') mpesaReceipt = String(item.Value || '')
        if (item.Name === 'Amount') amount = Number(item.Value || 0)
        if (item.Name === 'PhoneNumber') phoneNumber = String(item.Value || '')
      }
    }

    // Find our transaction row
    const txRes = await pool.query(
      `SELECT * FROM "MpesaTransaction" WHERE "checkoutRequestId" = $1 LIMIT 1`,
      [checkoutRequestId]
    )
    const tx = txRes.rows[0] || null

    const success = resultCode === 0

    // Update MpesaTransaction (always)
    if (tx) {
      await pool.query(
        `UPDATE "MpesaTransaction"
         SET status = $1, "mpesaReceipt" = $2, "resultCode" = $3,
             "resultDescription" = $4, "rawCallback" = $5::jsonb, "updatedAt" = NOW()
         WHERE id = $6`,
        [
          success ? 'SUCCESS' : 'FAILED',
          mpesaReceipt,
          resultCode,
          resultDesc,
          JSON.stringify(body),
          tx.id,
        ]
      )
    } else {
      // Unknown transaction (unexpected) — still log it
      const crypto = require('crypto')
      await pool.query(
        `INSERT INTO "MpesaTransaction"
           (id, "organizationId", "userId", purpose, amount, currency, "phoneNumber",
            "merchantRequestId", "checkoutRequestId", "mpesaReceipt", status,
            "resultCode", "resultDescription", "rawCallback", "createdAt", "updatedAt")
         VALUES ($1,'UNKNOWN','UNKNOWN','UNKNOWN',$2,'KES',$3,
                 $4,$5,$6,$7,
                 $8,$9,$10::jsonb,NOW(),NOW())`,
        [
          crypto.randomUUID(),
          amount || 0,
          phoneNumber || 'UNKNOWN',
          merchantRequestId,
          checkoutRequestId,
          mpesaReceipt,
          success ? 'SUCCESS' : 'FAILED',
          resultCode,
          resultDesc,
          JSON.stringify(body),
        ]
      )
    }

    // If subscription payment succeeded, extend/create Subscription
    if (success && tx && tx.purpose === 'SUBSCRIPTION' && tx.organizationId && tx.organizationId !== 'UNKNOWN') {
      const existing = await pool.query(
        `SELECT id, "endDate" FROM "Subscription" WHERE "organizationId" = $1 ORDER BY "createdAt" DESC LIMIT 1`,
        [tx.organizationId]
      )

      const now = new Date()
      const baseDate = existing.rowCount! > 0 && existing.rows[0].endDate && new Date(existing.rows[0].endDate) > now
        ? new Date(existing.rows[0].endDate)
        : now
      const newEnd = new Date(baseDate)
      newEnd.setDate(newEnd.getDate() + 30)

      if (existing.rowCount! > 0) {
        await pool.query(
          `UPDATE "Subscription"
           SET status = 'ACTIVE', "mpesaReceipt" = $1, "endDate" = $2, "nextBillingAt" = $2, "updatedAt" = NOW()
           WHERE id = $3`,
          [mpesaReceipt, newEnd, existing.rows[0].id]
        )
      } else {
        const crypto = require('crypto')
        await pool.query(
          `INSERT INTO "Subscription"
             (id, plan, status, amount, currency, "startDate", "endDate", "nextBillingAt",
              "mpesaReceipt", "userId", "organizationId", "createdAt", "updatedAt")
           VALUES ($1,'STARTER','ACTIVE',$2,'KES',NOW(),$3,$3,$4,$5,$6,NOW(),NOW())`,
          [
            crypto.randomUUID(),
            tx.amount || 500,
            newEnd,
            mpesaReceipt,
            tx.userId,
            tx.organizationId,
          ]
        )
      }

      // Audit log
      await pool.query(
        `INSERT INTO "AuditLog" (id, action, "entityType", "entityId", "organizationId", "userId", "createdAt")
         VALUES (gen_random_uuid()::text, 'SUBSCRIPTION_PAID', 'Subscription', $1, $2, $3, NOW())`,
        [checkoutRequestId, tx.organizationId, tx.userId]
      ).catch(() => { /* audit failure shouldn't break callback */ })
    }

    // Safaricom expects exactly this format — return 200 always
    return NextResponse.json({ ResultCode: 0, ResultDesc: 'Accepted' }, { status: 200 })
  } catch (error) {
    console.error('[mpesa/callback] unhandled:', error)
    // Still return 200 so Safaricom doesn't retry infinitely
    return NextResponse.json({ ResultCode: 0, ResultDesc: 'Accepted' }, { status: 200 })
  }
}