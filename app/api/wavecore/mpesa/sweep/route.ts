export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'

// ============================================================
// M-Pesa Sweep — Cron-friendly reconciliation
// Queries Safaricom for all STK_SENT transactions older than 60s.
// Updates those that have completed (or timed out) on Safaricom's side.
//
// Auth: requires CRON_SECRET (set in Vercel env) OR admin session.
// Called from:
//   - Vercel Cron (add to vercel.json)
//   - Manual admin action
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
  if (!key || !secret) throw new Error('MPESA_CONSUMER_KEY or SECRET not configured')
  const auth = Buffer.from(`${key}:${secret}`).toString('base64')
  const r = await fetch(MPESA_AUTH_URL, {
    method: 'GET',
    headers: { Authorization: `Basic ${auth}` },
    cache: 'no-store',
  })
  if (!r.ok) throw new Error('OAuth failed: ' + r.status)
  const data = await r.json()
  return data.access_token as string
}

async function queryOne(accessToken: string, tx: any, shortcode: string, passkey: string) {
  const timestamp = timestampNow()
  const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64')

  try {
    const r = await fetch(MPESA_QUERY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({
        BusinessShortCode: shortcode,
        Password: password,
        Timestamp: timestamp,
        CheckoutRequestID: tx.checkoutRequestId,
      }),
      cache: 'no-store',
    })
    const d: any = await r.json().catch(() => ({}))
    return { tx, data: d }
  } catch (err) {
    return { tx, error: (err as Error).message }
  }
}

export async function GET(req: NextRequest) {
  try {
    // Auth: CRON_SECRET header (for cron) OR ?key=CRON_SECRET
    const cronSecret = process.env.CRON_SECRET || ''
    const headerSecret = req.headers.get('x-cron-secret') || ''
    const querySecret = req.nextUrl.searchParams.get('key') || ''

    if (!cronSecret || (headerSecret !== cronSecret && querySecret !== cronSecret)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const shortcode = process.env.MPESA_SHORTCODE || '174379'
    const passkey = process.env.MPESA_PASSKEY || ''
    if (!passkey) return NextResponse.json({ error: 'MPESA_PASSKEY not configured' }, { status: 500 })

    // Find STK_SENT transactions older than 60 seconds
    const stuckRes = await pool.query(
      `SELECT * FROM "MpesaTransaction"
       WHERE status = 'STK_SENT'
         AND "createdAt" < NOW() - INTERVAL '60 seconds'
         AND "createdAt" > NOW() - INTERVAL '30 minutes'
       ORDER BY "createdAt" ASC
       LIMIT 100`
    )

    if (stuckRes.rowCount === 0) {
      return NextResponse.json({ processed: 0, message: 'No stuck transactions' })
    }

    let accessToken: string
    try {
      accessToken = await getAccessToken()
    } catch (err) {
      return NextResponse.json({ error: 'OAuth failed: ' + (err as Error).message }, { status: 503 })
    }

    let updated = 0
    let stillPending = 0
    let failed = 0
    const details: any[] = []

    for (const tx of stuckRes.rows) {
      const result: any = await queryOne(accessToken, tx, shortcode, passkey)
      if (result.error) {
        details.push({ id: tx.id, error: result.error })
        continue
      }
      const data = result.data
      const resultCode = data.ResultCode !== undefined ? String(data.ResultCode) : ''
      const resultDesc = String(data.ResultDesc || data.errorMessage || '')
      const isSuccess = resultCode === '0'
      const isPending = ['1', '1037'].includes(resultCode) || /processing|pending/i.test(resultDesc)

      let newStatus = isSuccess ? 'SUCCESS' : isPending ? 'STK_SENT' : 'FAILED'
      if (newStatus !== 'STK_SENT') {
        await pool.query(
          `UPDATE "MpesaTransaction"
           SET status = $1, "resultCode" = $2, "resultDescription" = $3,
               "rawCallback" = COALESCE("rawCallback", $4::jsonb), "updatedAt" = NOW()
           WHERE id = $5`,
          [newStatus, resultCode ? Number(resultCode) || null : null, resultDesc || null, JSON.stringify(data), tx.id]
        )
        updated++
        if (newStatus === 'FAILED') failed++
        details.push({ id: tx.id, status: newStatus, resultCode, resultDesc })
      } else {
        stillPending++
      }
    }

    return NextResponse.json({
      processed: stuckRes.rowCount,
      updated,
      stillPending,
      failed,
      details,
    })
  } catch (error) {
    console.error('[mpesa/sweep] unhandled:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}