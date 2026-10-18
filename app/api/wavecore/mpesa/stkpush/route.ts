export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

// ============================================================
// M-Pesa Daraja — STK Push (Lipa Na M-Pesa Online)
// Sandbox + Production aware via MPESA_ENVIRONMENT
// ============================================================

const ENV = (process.env.MPESA_ENVIRONMENT || 'sandbox').toLowerCase()
const IS_PROD = ENV === 'production'

const MPESA_AUTH_URL = IS_PROD
  ? 'https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials'
  : 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials'

const MPESA_STK_URL = IS_PROD
  ? 'https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest'
  : 'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest'

// Rate limiting — 3 STK pushes per phone per minute
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
  if (!key || !secret) {
    throw new Error('MPESA_CONSUMER_KEY or MPESA_CONSUMER_SECRET not configured')
  }
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
  // Format: YYYYMMDDHHmmss
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

// ============================================================
// POST /api/wavecore/mpesa/stkpush
// Body: { phoneNumber: string, plan?: 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE' }
// ============================================================
export async function POST(req: NextRequest) {
  try {
    const session = await requireTenant(req)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json().catch(() => ({}))
    const rawPhone = String(body?.phoneNumber || '').trim()
    const plan = ['TRIAL', 'STARTER', 'PROFESSIONAL', 'ENTERPRISE'].includes(body?.plan)
      ? body.plan
      : 'STARTER'

    // Validate phone (Kenyan)
    const cleaned = rawPhone.replace(/[\s\-()]/g, '')
    if (!/^(?:\+?254|0)(?:7\d{8}|1\d{8})$/.test(cleaned)) {
      return NextResponse.json({ error: 'Invalid phone number. Use format 2547XXXXXXXX or 07XXXXXXXX.' }, { status: 400 })
    }

    // Rate limit
    if (!checkRateLimit(cleaned)) {
      return NextResponse.json({ error: 'Too many attempts. Try again in 1 minute.' }, { status: 429 })
    }

    // Normalize to 2547XXXXXXXX
    const formattedPhone = cleaned.startsWith('0')
      ? '254' + cleaned.slice(1)
      : cleaned.startsWith('+254')
        ? cleaned.slice(1)
        : cleaned

    const shortcode = process.env.MPESA_SHORTCODE || '174379'
    const passkey = process.env.MPESA_PASSKEY || ''
    if (!passkey) return NextResponse.json({ error: 'MPESA_PASSKEY not configured' }, { status: 500 })

    const amount = Number(body?.amount) > 0 ? Number(body.amount) : Number(process.env.MPESA_SUBSCRIPTION_AMOUNT || 500)
    const timestamp = timestampNow()
    const password = generatePassword(shortcode, passkey, timestamp)

    // Get token
    let accessToken: string
    try {
      accessToken = await getAccessToken()
    } catch (err) {
      console.error('[mpesa/stkpush] OAuth error:', (err as Error).message)
      return NextResponse.json({
        error: 'M-Pesa service unavailable. Check your Consumer Key/Secret.',
      }, { status: 503 })
    }

    // Build request
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
      AccountReference: 'WaveCore ' + plan,
      TransactionDesc: 'WaveCore ERP ' + plan + ' Subscription',
    }

    const stkResponse = await fetch(MPESA_STK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(requestPayload),
      cache: 'no-store',
    })

    const stkData: any = await stkResponse.json().catch(() => ({}))

    // Response codes:
    //   0    = success (STK Push sent)
    //   1032 = user cancelled
    //   1037 = user unreachable
    //   etc.
    const isSuccess = stkData.ResponseCode === '0'

    // Log transaction regardless of success
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
        session!.organizationId,
        session!.userId,
        amount,
        formattedPhone,
        stkData.MerchantRequestID || null,
        stkData.CheckoutRequestID || null,
        isSuccess ? 'STK_SENT' : 'STK_FAILED',
        Number(stkData.ResponseCode || 0) || null,
        stkData.ResponseDescription || stkData.errorMessage || null,
        JSON.stringify(requestPayload),
      ]
    )

    if (isSuccess) {
      return NextResponse.json({
        success: true,
        message: 'STK Push sent. Enter your M-Pesa PIN on your phone.',
        transactionId: txId,
        checkoutRequestId: stkData.CheckoutRequestID,
        merchantRequestId: stkData.MerchantRequestID,
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