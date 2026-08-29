export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { checkRedisRateLimit } from '@/lib/wavecore/security/redis-limiter'

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    
    // Rate limit: 3 attempts per 15 min
    const rateLimit = await checkRedisRateLimit('forgot-password:' + ip, 3, 900)
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: 'Too many attempts. Try again in 15 minutes.' }, { status: 429 })
    }

    const body = await request.json()
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

    // Save OTP with 10-minute expiry
    await pool.query(
      `UPDATE "User" SET "otpCode" = $1, "otpExpiry" = NOW() + INTERVAL '10 minutes', "resetToken" = $2, "resetExpiry" = NOW() + INTERVAL '30 minutes' WHERE id = $3`,
      [otp, resetToken, user.id]
    )

    return NextResponse.json({
      success: true,
      message: `OTP sent to ${identifier}`,
      otp: otp,
      resetToken: resetToken,
      user: { id: user.id, name: user.name, email: user.email }
    })
  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 })
  }
}