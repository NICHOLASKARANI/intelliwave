import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

// M-Pesa Daraja API Configuration
// Set these in Vercel Environment Variables:
// MPESA_CONSUMER_KEY=your_consumer_key
// MPESA_CONSUMER_SECRET=your_consumer_secret
// MPESA_PASSKEY=your_passkey
// MPESA_SHORTCODE=174379 (Paybill)
// MPESA_CALLBACK_URL=https://www.intelliwavve.com/api/wavecore/mpesa/callback

const MPESA_AUTH_URL = 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials'
const MPESA_STK_URL = 'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest'

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
  
  if (entry.count >= 3) return false // Max 3 STK pushes per minute
  entry.count++
  return true
}

// Generate M-Pesa Access Token
async function getAccessToken(): Promise<string> {
  const auth = Buffer.from(
    `${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`
  ).toString('base64')

  const response = await fetch(MPESA_AUTH_URL, {
    method: 'GET',
    headers: { Authorization: `Basic ${auth}` },
  })

  const data = await response.json()
  return data.access_token
}

// Generate M-Pesa Password
function generatePassword(shortcode: string, passkey: string, timestamp: string): string {
  return Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64')
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireTenant(req)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { phoneNumber } = body

    // Validate phone number (Kenyan format)
    const cleaned = phoneNumber.replace(/[\s-]/g, '')
    if (!/^(?:\+?254|0)(?:7\d{8}|1\d{8})$/.test(cleaned)) {
      return NextResponse.json({ error: 'Invalid phone number format' }, { status: 400 })
    }

    // Rate limiting
    if (!checkRateLimit(cleaned)) {
      return NextResponse.json({ error: 'Too many attempts. Try again in 1 minute.' }, { status: 429 })
    }

    // Format phone to 2547XXXXXXXX
    const formattedPhone = cleaned.startsWith('0') 
      ? '254' + cleaned.slice(1) 
      : cleaned.startsWith('+254') 
        ? cleaned.slice(1) 
        : cleaned

    const timestamp = new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14)
    const shortcode = process.env.MPESA_SHORTCODE || '174379'
    const passkey = process.env.MPESA_PASSKEY || ''
    const password = generatePassword(shortcode, passkey, timestamp)

    // Get access token
    let accessToken: string
    try {
      accessToken = await getAccessToken()
    } catch (error) {
      return NextResponse.json({ 
        error: 'M-Pesa service unavailable. Please configure Consumer Key.', 
        needsConfig: true 
      }, { status: 503 })
    }

    // Send STK Push
    const stkResponse = await fetch(MPESA_STK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        BusinessShortCode: shortcode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: 500, // KSh 500 subscription
        PartyA: formattedPhone,
        PartyB: shortcode,
        PhoneNumber: formattedPhone,
        CallBackURL: process.env.MPESA_CALLBACK_URL || 'https://www.intelliwavve.com/api/wavecore/mpesa/callback',
        AccountReference: 'WaveCore ERP',
        TransactionDesc: 'WaveCore ERP Monthly Subscription',
      }),
    })

    const stkData = await stkResponse.json()

    if (stkData.ResponseCode === '0') {
      // Store pending transaction
      await pool.query(
        `INSERT INTO "Subscription" ("organizationId", "userId", plan, status, amount, currency, "mpesaReceipt", "createdAt", "updatedAt")
         VALUES ($1, $2, 'MONTHLY', 'PENDING', 500, 'KES', $3, NOW(), NOW())`,
        [session!.organizationId, session!.userId, stkData.CheckoutRequestID]
      )

      return NextResponse.json({
        success: true,
        message: 'STK Push sent. Enter PIN on your phone.',
        checkoutRequestId: stkData.CheckoutRequestID,
      })
    } else {
      return NextResponse.json({ 
        error: stkData.ResponseDescription || 'STK Push failed' 
      }, { status: 400 })
    }
  } catch (error) {
    console.error('STK Push error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}