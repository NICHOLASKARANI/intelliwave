export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'

// ============================================================
// M-Pesa Daraja — Callback handler
// Safaricom POSTs here after customer enters PIN.
// Reads plan + days from MpesaTransaction.rawRequest._wavecore
// so multi-month plans get the correct endDate.
// ============================================================

const PLAN_DAYS_FALLBACK: Record<string, number> = {
  MONTHLY: 30, QUARTERLY: 90, SEMIANNUAL: 180, YEARLY: 365,
  STARTER: 30, PROFESSIONAL: 30, ENTERPRISE: 30,
}

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
    let callbackAmount: number | null = null
    let callbackPhone: string | null = null

    if (Array.isArray(stkCallback.CallbackMetadata?.Item)) {
      for (const item of stkCallback.CallbackMetadata.Item) {
        if (item.Name === 'MpesaReceiptNumber') mpesaReceipt = String(item.Value || '')
        if (item.Name === 'Amount') callbackAmount = Number(item.Value || 0)
        if (item.Name === 'PhoneNumber') callbackPhone = String(item.Value || '')
      }
    }

    // Load our transaction
    const txRes = await pool.query(
      `SELECT * FROM "MpesaTransaction" WHERE "checkoutRequestId" = $1 LIMIT 1`,
      [checkoutRequestId]
    )
    const tx = txRes.rows[0] || null
    const success = resultCode === 0

    // Update MpesaTransaction
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
      // Unknown transaction — log it
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
          callbackAmount || 0,
          callbackPhone || 'UNKNOWN',
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

    // ─── Subscription activation on success ───
    if (success && tx && tx.purpose === 'SUBSCRIPTION' && tx.organizationId && tx.organizationId !== 'UNKNOWN') {
      // Read plan + days from rawRequest._wavecore
      let plan = 'MONTHLY'
      let daysToAdd = 30
      try {
        const raw = typeof tx.rawRequest === 'string' ? JSON.parse(tx.rawRequest) : tx.rawRequest
        if (raw?._wavecore?.plan) plan = String(raw._wavecore.plan)
        if (Number(raw?._wavecore?.days) > 0) daysToAdd = Number(raw._wavecore.days)
      } catch { /* fall through to defaults */ }
      if (!(daysToAdd > 0)) daysToAdd = PLAN_DAYS_FALLBACK[plan] || 30

      const existing = await pool.query(
        `SELECT id, "endDate", status FROM "Subscription"
         WHERE "organizationId" = $1 ORDER BY "createdAt" DESC LIMIT 1`,
        [tx.organizationId]
      )

      const now = new Date()
      let baseDate = now
      if (existing.rowCount! > 0 && existing.rows[0].endDate) {
        const prevEnd = new Date(existing.rows[0].endDate)
        // If existing subscription is still active, extend from its end.
        // If expired, start fresh from now.
        baseDate = prevEnd > now ? prevEnd : now
      }
      const newEnd = new Date(baseDate)
      newEnd.setDate(newEnd.getDate() + daysToAdd)

      if (existing.rowCount! > 0) {
        await pool.query(
          `UPDATE "Subscription"
           SET plan = $1, status = 'ACTIVE', amount = $2,
               "mpesaReceipt" = $3, "endDate" = $4, "nextBillingAt" = $4, "updatedAt" = NOW()
           WHERE id = $5`,
          [
            'STARTER',
            Number(tx.amount || callbackAmount || 500),
            mpesaReceipt,
            newEnd,
            existing.rows[0].id,
          ]
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
            Number(tx.amount || callbackAmount || 500),
            newEnd,
            mpesaReceipt,
            tx.userId,
            tx.organizationId,
          ]
        )
      }

      // Audit
      await pool.query(
        `INSERT INTO "AuditLog" (id, action, "entityType", "entityId", "organizationId", "userId", "createdAt")
         VALUES (gen_random_uuid()::text, 'SUBSCRIPTION_PAID', 'Subscription', $1, $2, $3, NOW())`,
        [checkoutRequestId, tx.organizationId, tx.userId]
      ).catch(() => {})
    }

    // ─── Executive Portal auto-verify (non-blocking, never breaks payment) ───
    try {
      if (success && mpesaReceipt && tx?.organizationId && tx.organizationId !== 'UNKNOWN') {
        const userLookup = await pool.query(
          `SELECT email FROM "User" WHERE id = $1 LIMIT 1`,
          [tx.userId]
        )
        const userEmail = userLookup.rows[0]?.email || null

        if (userEmail) {
          const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.intelliwavve.com'
          fetch(`${baseUrl}/api/executives/verify-payment`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-webhook-secret': process.env.SHOP_ADMIN_PASSWORD || '',
            },
            body: JSON.stringify({
              customer_email: userEmail,
              organization_id: tx.organizationId,
              amount: Number(tx.amount || callbackAmount || 0),
              status: 'SUCCESS',
            }),
          }).catch((e) => console.error('[mpesa→exec] verify-payment failed:', e?.message || e))
        }
      }
    } catch (execError: any) {
      console.error('[mpesa→exec] hook error:', execError?.message || execError)
    }
    // ─────────────────────────────────────────────────────────────────────────

    // ─── Send subscription confirmation email ───
    try {
      if (success && tx && tx.purpose === 'SUBSCRIPTION' && tx.userId && tx.organizationId && tx.organizationId !== 'UNKNOWN') {
        const { sendEmail } = await import('@/lib/wavecore/email')
        const userLookup = await pool.query(
          `SELECT name, email FROM "User" WHERE id = $1 LIMIT 1`,
          [tx.userId]
        )
        const userInfo = userLookup.rows[0]
        const orgLookup = await pool.query(
          `SELECT name FROM "Organization" WHERE id = $1 LIMIT 1`,
          [tx.organizationId]
        )
        const orgInfo = orgLookup.rows[0]
        const subLookup = await pool.query(
          `SELECT plan, "endDate" FROM "Subscription" WHERE "organizationId" = $1 ORDER BY "createdAt" DESC LIMIT 1`,
          [tx.organizationId]
        )
        const subInfo = subLookup.rows[0]
        const endDateStr = subInfo?.endDate ? new Date(subInfo.endDate).toLocaleDateString('en-KE', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'
        const planLabel = subInfo?.plan === 'PROFESSIONAL' ? 'WaveCore Pro' : subInfo?.plan === 'ENTERPRISE' ? 'WaveCore Enterprise' : 'WaveCore ERP'

        if (userInfo && userInfo.email) {
          await sendEmail({
            to: userInfo.email,
            subject: 'Your WaveCore subscription is active',
            text: `Hi ${userInfo.name || 'there'},` + "`n`n" + `Your payment of KES ${Number(tx.amount || 0).toLocaleString()} has been received (M-Pesa receipt: ${mpesaReceipt || '—'}).` + "`n`n" + `Your subscription is now active until ${endDateStr}.` + "`n`n" + `Plan: ${planLabel}` + "`n" + `Organization: ${orgInfo?.name || '—'}` + "`n`n" + `Log in: https://www.intelliwavve.com/wavecore-erp` + "`n`n" + `Questions? Contact support@intelliwavve.com.`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
                <div style="text-align: center; padding-bottom: 20px; border-bottom: 2px solid #10b981; margin-bottom: 24px;">
                  <h1 style="color: #10b981; font-size: 24px; margin: 0;">✓ Payment Confirmed</h1>
                </div>
                <p>Hi ${userInfo.name || 'there'},</p>
                <p>Your payment of <strong>KES ${Number(tx.amount || 0).toLocaleString()}</strong> has been received successfully.</p>
                <div style="background: #f0fdf4; border-left: 4px solid #10b981; border-radius: 8px; padding: 20px; margin: 24px 0;">
                  <p style="margin: 0 0 8px 0;"><strong>Plan:</strong> ${planLabel}</p>
                  <p style="margin: 0 0 8px 0;"><strong>Active until:</strong> ${endDateStr}</p>
                  <p style="margin: 0 0 8px 0;"><strong>M-Pesa Receipt:</strong> ${mpesaReceipt || '—'}</p>
                  <p style="margin: 0;"><strong>Organization:</strong> ${orgInfo?.name || '—'}</p>
                </div>
                <p style="text-align: center; margin: 32px 0;">
                  <a href="https://www.intelliwavve.com/wavecore-erp" style="display: inline-block; padding: 14px 32px; background: #10b981; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">Log In to WaveCore</a>
                </p>
                <p style="color: #6b7280; font-size: 12px;">Questions? Contact support@intelliwavve.com.</p>
              </div>
            `,
            userId: tx.userId,
            organizationId: tx.organizationId,
          }).catch((e: any) => console.error('[mpesa/callback] confirmation email failed:', e?.message))
        }
      }
    } catch (emailErr: any) {
      console.error('[mpesa/callback] email block error:', emailErr?.message)
    }

    // ─────────────────────────────────────────────────────────────────────────

    // Safaricom expects 200 + ResultCode 0 to stop retries
    return NextResponse.json({ ResultCode: 0, ResultDesc: 'Accepted' }, { status: 200 })
  } catch (error) {
    console.error('[mpesa/callback] unhandled:', error)
    return NextResponse.json({ ResultCode: 0, ResultDesc: 'Accepted' }, { status: 200 })
  }
}