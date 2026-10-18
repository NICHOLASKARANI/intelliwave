export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

// ============================================================
// M-Pesa Daraja — STK Push
// Supports both monthly and multi-month plans.
// Reads { phoneNumber, plan, amount, days } from request body.
// ============================================================

const ENV = (process.env.MPESA_ENVIRONMENT || 'sandbox').toLowerCase()
const IS_PROD = ENV === 'production'

const MPESA_AUTH_URL = IS_PROD
  ? 'https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials'
  : 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials'

const MPESA_STK_URL = IS_PROD
  ? 'https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest'
  : 'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest'

// Plan definitions — canonical source of truth
const PLAN_DEFAULTS: Record<string, { amount: number; days: number; name: string }> = {
  MONTHLY:    { amount: 500,  days: 30,  name: 'Monthly' },
  QUARTERLY:  { amount: 1350, days: 90,  name: '3 Months' },
  SEMIANNUAL: { amount: 2750, days: 180, name: '6 Months' },
  YEARLY:     { amount: 5000, days: 365, name: '1 Year' },
  // legacy aliases
  STARTER:      { amount: 500,  days: 30, name: 'Monthly' },
  PROFESSIONAL: { amount: 2500, days: 30, name: 'Monthly Pro' },
  ENTERPRISE:   { amount: 10000, days: 30, name: 'Monthly Enterprise' },
}

// Rate limiting
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

function checkRateLimit(phone: string): boolean {
  const now = Date.now()
  const key = 'stk:' + phone
  const entry = rateLimitMap.get(key)
  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + 60000 })
    return true
  }
  if (entry.count >= 3) return false
  entry.count++
  return true
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
  if (!r.ok) throw new Error('M-Pesa OAuth failed: ' + r.status)
  const data = await r.json()
  if (!data.access_token) throw new Error('No access token returned')
  return data.access_token as string
}

function generatePassword(shortcode: string, passkey: string, timestamp: string): string {
  return Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64')
}

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

/**
 * POST /api/wavecore/mpesa/stkpush
 * Body: {
 *   phoneNumber: string
 *   plan?:  MONTHLY | QUARTERLY | SEMIANNUAL | YEARLY
 *   amount?: number  (override — validated against plan if not matched, still accepted)
 *   days?:   number  (override — how many days access should be granted)
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const session = await requireTenant(req)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json().catch(() => ({}))
    const rawPhone = String(body?.phoneNumber || '').trim()

    // Parse plan + amount + days
    const planKey = String(body?.plan || 'MONTHLY').toUpperCase()
    const planDefaults = PLAN_DEFAULTS[planKey] || PLAN_DEFAULTS.MONTHLY

    const bodyAmount = Number(body?.amount)
    const amount = Number.isFinite(bodyAmount) && bodyAmount > 0 ? bodyAmount : planDefaults.amount

    const bodyDays = Number(body?.days)
    const days = Number.isFinite(bodyDays) && bodyDays > 0 ? bodyDays : planDefaults.days

    const planName = planDefaults.name

    // Validate phone (Kenyan)
    const cleaned = rawPhone.replace(/[\s\-()]/g, '')
    if (!/^(?:\+?254|0)(?:7\d{8}|1\d{8})$/.test(cleaned)) {
      return NextResponse.json({ error: 'Invalid phone number. Use format 2547XXXXXXXX or 07XXXXXXXX.' }, { status: 400 })
    }

    // Rate limit
    if (!checkRateLimit(cleaned)) {
      return NextResponse.json({ error: 'Too many attempts. Try again in 1 minute.' }, { status: 429 })
    }

    // Normalize phone
    const formattedPhone = cleaned.startsWith('0')
      ? '254' + cleaned.slice(1)
      : cleaned.startsWith('+254')
        ? cleaned.slice(1)
        : cleaned

    const shortcode = process.env.MPESA_SHORTCODE || '174379'
    const passkey = process.env.MPESA_PASSKEY || ''
    if (!passkey) return NextResponse.json({ error: 'MPESA_PASSKEY not configured' }, { status: 500 })

    const timestamp = timestampNow()
    const password = generatePassword(shortcode, passkey, timestamp)

    let accessToken: string
    try {
      accessToken = await getAccessToken()
    } catch (err) {
      console.error('[mpesa/stkpush] OAuth error:', (err as Error).message)
      return NextResponse.json({ error: 'M-Pesa service unavailable. Check Consumer Key/Secret.' }, { status: 503 })
    }

    // Safaricom request
    const requestPayload = {
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: amount,
      PartyA: formattedPhone,
      PartyB: shortcode,
      PhoneNumber: formattedPhone,
      CallBackURL: process.env.MPESA_CALLBACK_URL || 'https://www.intelliwavve.com/api/wavecore/mpesa/callback',
      AccountReference: 'WaveCore ' + planKey,
      TransactionDesc: 'WaveCore ' + planName + ' (' + days + ' days)',
    }

    const stkResponse = await fetch(MPESA_STK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify(requestPayload),
      cache: 'no-store',
    })

    const stkData: any = await stkResponse.json().catch(() => ({}))
    const isSuccess = stkData.ResponseCode === '0'

    // Build full request record — includes plan + days so callback can use them
    const enrichedRequest = {
      ...requestPayload,
      // Our metadata (Safaricom ignores unknown fields on their side but we store them)
      _wavecore: {
        plan: planKey,
        planName,
        days,
        amount,
        phone: formattedPhone,
      },
    }

    const crypto = require('crypto')
    const txId = crypto.randomUUID()

    await pool.query(
      `INSERT INTO "MpesaTransaction"
         (id, "organizationId", "userId", purpose, amount, currency, "phoneNumber",
          "merchantRequestId", "checkoutRequestId", status, "resultCode", "resultDescription",
          "rawRequest", "createdAt", "updatedAt")
       VALUES ($1,$2,$3,'SUBSCRIPTION',$4,'KES',$5,
               $6,$7,$8,$9,$10,
               $11::jsonb,NOW(),NOW())`,
      [
        txId,
        session.organizationId,
        session.userId,
        amount,
        formattedPhone,
        stkData.MerchantRequestID || null,
        stkData.CheckoutRequestID || null,
        isSuccess ? 'STK_SENT' : 'STK_FAILED',
        Number(stkData.ResponseCode || 0) || null,
        stkData.ResponseDescription || stkData.errorMessage || null,
        JSON.stringify(enrichedRequest),
      ]
    )

    if (isSuccess) {
      return NextResponse.json({
        success: true,
        message: 'STK Push sent. Enter your M-Pesa PIN on your phone.',
        transactionId: txId,
        checkoutRequestId: stkData.CheckoutRequestID,
        merchantRequestId: stkData.MerchantRequestID,
        plan: planKey,
        planName,
        amount,
        days,
      })
    } else {
      return NextResponse.json({
        success: false,
        error: stkData.ResponseDescription || stkData.errorMessage || 'STK Push failed',
        responseCode: stkData.ResponseCode,
        transactionId: txId,
      }, { status: 400 })
    }
  } catch (error) {
    console.error('[mpesa/stkpush] unhandled:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}