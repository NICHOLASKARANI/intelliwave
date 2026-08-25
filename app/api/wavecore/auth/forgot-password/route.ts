import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'

// Rate limiting
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const bucket = rateLimitMap.get(ip)
  if (!bucket || bucket.resetAt < now) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 900000 })
    return true
  }
  if (bucket.count >= 3) return false
  bucket.count++
  return true
}

// Generate 6-digit OTP
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Too many attempts. Try again in 15 minutes.' },
        { status: 429 }
      )
    }

    const body = await req.json()
    const { identifier } = body // Can be email OR phone

    if (!identifier) {
      return NextResponse.json({ error: 'Email or phone number required' }, { status: 400 })
    }

    // Find user by email OR phone
    const userResult = await pool.query(
      `SELECT id, email, phone, name FROM "User" WHERE email = $1 OR phone = $2 AND "isActive" = true`,
      [identifier, identifier]
    )

    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: 'No account found with this email or phone' }, { status: 404 })
    }

    const user = userResult.rows[0]
    const otp = generateOTP()
    const resetToken = require('crypto').randomUUID()

    // Save OTP and token
    await pool.query(
      `UPDATE "User" SET "otpCode" = $1, "otpExpiry" = NOW() + INTERVAL '10 minutes', "resetToken" = $2, "resetExpiry" = NOW() + INTERVAL '30 minutes' WHERE id = $3`,
      [otp, resetToken, user.id]
    )

    // In production: Send OTP via email (sendgrid) or SMS (twilio/africastalking)
    // For now, return OTP in response for testing
    return NextResponse.json({
      success: true,
      message: `OTP sent to ${identifier}`,
      otp: otp, // REMOVE IN PRODUCTION - only for testing
      resetToken: resetToken,
      userId: user.id
    })
  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 })
  }
}