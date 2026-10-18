export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

// ============================================================
// M-Pesa Daraja — STK Query
// Use this when the callback hasn't fired (network issue, timeout).
// Queries Safaricom directly for the current status of a checkout ID.
// ============================================================

const ENV = (process.env.MPESA_ENVIRONMENT || 'sandbox').toLowerCase()
const IS_PROD = ENV === 'production'

const MPESA_AUTH_URL = IS_PROD
  ? 'https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials'
  : 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials'

const MPESA_QUERY_URL = IS_PROD
  ? 'https://api.safaricom.co.ke/mpesa/stkpushquery/v1/query'
  : 'https://sandbox.safaricom.co.ke/mpesa/stkpushquery/v1/query'

function timestampNow(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return (
    d.getFullYear().toString() +
    pad(d.getMonth() + 1) +
    pad(d.getDate()) +
    pad(d.getHours()) +
    pad(d.getMinutes()) +
    pad(d.getSeconds())
  )
}

async function getAccessToken(): Promise<string> {
  const key = process.env.MPESA_CONSUMER_KEY || ''
  const secret = process.env.MPESA_CONSUMER_SECRET || ''
  if (!key || !secret) throw new Error('MPESA_CONSUMER_KEY or MPESA_CONSUMER_SECRET not configured')
  const auth = Buffer.from(`${key}:${secret}`).toString('base64')

  const r = await fetch(MPESA_AUTH_URL, {
    method: 'GET',
    headers: { Authorization: `Basic ${auth}` },
    cache: 'no-store',
  })
  if (!r.ok) throw new Error('OAuth failed: ' + r.status)
  const data = await r.json()
  if (!data.access_token) throw new Error('No access token returned')
  return data.access_token as string
}

/**
 * POST /api/wavecore/mpesa/query
 * Body: { checkoutRequestId: string }
 *
 * Queries Safaricom directly for the current status of the STK Push.
 * Updates MpesaTransaction, and if SUCCESS + SUBSCRIPTION, activates Subscription.
 *
 * This is the manual override for stuck STK_SENT transactions.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await requireTenant(req)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json().catch(() => ({}))
    const checkoutRequestId = String(body?.checkoutRequestId || '').trim()
    if (!checkoutRequestId) {
      return NextResponse.json({ error: 'checkoutRequestId is required' }, { status: 400 })
    }

    // Load transaction (verify tenant ownership)
    const txRes = await pool.query(
      `SELECT * FROM "MpesaTransaction"
       WHERE "checkoutRequestId" = $1 AND "organizationId" = $2
       LIMIT 1`,
      [checkoutRequestId, session.organizationId]
    )
    if (txRes.rowCount === 0) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
    }
    const tx = txRes.rows[0]

    // Short-circuit: already finished
    if (['SUCCESS', 'FAILED'].includes(tx.status)) {
      return NextResponse.json({
        status: tx.status,
        mpesaReceipt: tx.mpesaReceipt,
        resultCode: tx.resultCode,
        resultDescription: tx.resultDescription,
        source: 'db',
        message: 'Transaction already completed. Returned cached status.',
      })
    }

    const shortcode = process.env.MPESA_SHORTCODE || '174379'
    const passkey = process.env.MPESA_PASSKEY || ''
    if (!passkey) return NextResponse.json({ error: 'MPESA_PASSKEY not configured' }, { status: 500 })

    const timestamp = timestampNow()
    const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64')

    let accessToken: string
    try {
      accessToken = await getAccessToken()
    } catch (err) {
      return NextResponse.json({ error: 'M-Pesa OAuth failed: ' + (err as Error).message }, { status: 503 })
    }

    // Query Safaricom
    const qRes = await fetch(MPESA_QUERY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({
        BusinessShortCode: shortcode,
        Password: password,
        Timestamp: timestamp,
        CheckoutRequestID: checkoutRequestId,
      }),
      cache: 'no-store',
    })

    const qData: any = await qRes.json().catch(() => ({}))

    // Response codes:
    //   0    = success (payment completed)
    //   1032 = cancelled by user
    //   1037 = timeout / user unreachable
    //   1    = waiting (transaction still pending)
    //   500.001.1001 = still processing
    const resultCode = qData.ResultCode !== undefined ? String(qData.ResultCode) : ''
    const resultDesc = String(qData.ResultDesc || qData.errorMessage || '')
    const isSuccess = resultCode === '0'
    const isPending = ['1', '1037'].includes(resultCode) || /processing|pending/i.test(resultDesc)

    let newStatus: string
    if (isSuccess) newStatus = 'SUCCESS'
    else if (isPending) newStatus = 'STK_SENT'
    else newStatus = 'FAILED'

    // Update DB
    await pool.query(
      `UPDATE "MpesaTransaction"
       SET status = $1, "resultCode" = $2, "resultDescription" = $3,
           "rawCallback" = COALESCE("rawCallback", $4::jsonb), "updatedAt" = NOW()
       WHERE id = $5`,
      [
        newStatus,
        resultCode ? Number(resultCode) || null : null,
        resultDesc || null,
        JSON.stringify(qData),
        tx.id,
      ]
    )

    // If SUCCESS + SUBSCRIPTION → activate Subscription
    if (isSuccess && tx.purpose === 'SUBSCRIPTION') {
      const existing = await pool.query(
        `SELECT id, "endDate" FROM "Subscription"
         WHERE "organizationId" = $1 ORDER BY "createdAt" DESC LIMIT 1`,
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
           SET status = 'ACTIVE', "mpesaReceipt" = COALESCE("mpesaReceipt", $1),
               "endDate" = $2, "nextBillingAt" = $2, "updatedAt" = NOW()
           WHERE id = $3`,
          [tx.mpesaReceipt, newEnd, existing.rows[0].id]
        )
      }
    }

    return NextResponse.json({
      status: newStatus,
      resultCode,
      resultDescription: resultDesc,
      source: 'safaricom',
      isSuccess,
      isPending,
      mpesaReceipt: qData.MpesaReceiptNumber || tx.mpesaReceipt,
    })
  } catch (error) {
    console.error('[mpesa/query] unhandled:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}