import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { checkRedisRateLimit } from '@/lib/wavecore/security/redis-limiter'
import { sendOTP } from '@/lib/wavecore/security/otp-service'

// Generate 6-digit OTP
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    
    // Redis rate limiting - 3 attempts per 15 min per IP
    const rateLimit = await checkRedisRateLimit(`forgot-password:${ip}`, 3, 900)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many attempts. Try again later.' },
        { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfter) } }
      )
    }

    const body = await req.json()
    const { identifier } = body

    if (!identifier) {
      return NextResponse.json({ error: 'Email or phone number required' }, { status: 400 })
    }

    // Find user by email OR phone
    const userResult = await pool.query(
      `SELECT id, email, phone, name FROM "User" WHERE (email = $1 OR phone = $1) AND "isActive" = true`,
      [identifier]
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

    // Send OTP via email or SMS
    const otpResult = await sendOTP(identifier, otp)

    // In production, don't return OTP. Only for testing when services not configured
    return NextResponse.json({
      success: true,
      message: otpResult.message,
      otp: otpResult.debugOtp || undefined,
      resetToken: resetToken
    })
  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 })
  }
}