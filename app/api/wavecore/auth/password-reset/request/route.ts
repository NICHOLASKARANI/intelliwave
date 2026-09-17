export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { pool } from '@/lib/wavecore/db'
import {
  generateOtp, hashOtp, maskDestination, deliverOtp, logAuthEvent,
  OTP_TTL_MINUTES, OTP_RESEND_COOLDOWN_SECONDS, OTP_REQUEST_RATE_LIMIT, OTP_RATE_LIMIT_WINDOW_MINUTES
} from '@/lib/wavecore/auth/otp'

const GENERIC_MESSAGE = 'If an account exists with those details, a verification code has been sent.'

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    const ua = req.headers.get('user-agent') || 'unknown'
    const body = await req.json()
    const rawIdentifier = String(body?.identifier || '').trim()

    if (!rawIdentifier) {
      return NextResponse.json({ error: 'Email or phone is required' }, { status: 400 })
    }

    const isEmail = rawIdentifier.includes('@')
    const identifier = isEmail ? rawIdentifier.toLowerCase() : rawIdentifier.replace(/[\s-]/g, '')

    // Rate limit per identifier (protect against enumeration)
    const windowStart = new Date(Date.now() - OTP_RATE_LIMIT_WINDOW_MINUTES * 60 * 1000)
    const recent = await pool.query(
      `SELECT COUNT(*)::int AS c FROM "AuthAuditLog"
       WHERE event = 'PASSWORD_RESET_REQUESTED'
         AND metadata LIKE $1
         AND "createdAt" > $2`,
      [`%${identifier}%`, windowStart]
    )
    if ((recent.rows[0]?.c || 0) >= OTP_REQUEST_RATE_LIMIT) {
      // Do not reveal; respond generic
      await logAuthEvent(null, 'PASSWORD_RESET_RATE_LIMITED', ip, ua, { identifier })
      return NextResponse.json({ success: true, message: GENERIC_MESSAGE })
    }

    const userQuery = isEmail
      ? 'SELECT id, name, email, phone FROM "User" WHERE LOWER(email) = $1 LIMIT 1'
      : 'SELECT id, name, email, phone FROM "User" WHERE phone = $1 LIMIT 1'
    const userRes = await pool.query(userQuery, [identifier])

    if (userRes.rows.length === 0) {
      // Generic response — do not reveal
      await logAuthEvent(null, 'PASSWORD_RESET_REQUESTED', ip, ua, { identifier, exists: false })
      return NextResponse.json({ success: true, message: GENERIC_MESSAGE })
    }

    const user = userRes.rows[0]

    // Resend cooldown
    const recent2 = await pool.query(
      `SELECT "createdAt" FROM "PasswordResetOtp"
       WHERE "userId" = $1 AND used = FALSE AND "invalidatedAt" IS NULL
       ORDER BY "createdAt" DESC LIMIT 1`,
      [user.id]
    )
    if (recent2.rows.length > 0) {
      const ageSec = (Date.now() - new Date(recent2.rows[0].createdAt).getTime()) / 1000
      if (ageSec < OTP_RESEND_COOLDOWN_SECONDS) {
        return NextResponse.json({
          success: true,
          message: GENERIC_MESSAGE,
          resendAfterSeconds: Math.ceil(OTP_RESEND_COOLDOWN_SECONDS - ageSec),
        })
      }
    }

    // Invalidate any previous outstanding OTPs for this user
    await pool.query(
      `UPDATE "PasswordResetOtp" SET "invalidatedAt" = NOW()
       WHERE "userId" = $1 AND used = FALSE AND "invalidatedAt" IS NULL`,
      [user.id]
    )

    // Generate cryptographically secure OTP + hash
    const otp = generateOtp()
    const otpHash = hashOtp(otp)
    const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000)
    const channel: 'email' | 'sms' = isEmail ? 'email' : 'sms'
    const destination = isEmail ? user.email : user.phone
    const masked = maskDestination(channel, destination)

    // Store hashed OTP
    await pool.query(
      `INSERT INTO "PasswordResetOtp"
       (id, "userId", "otpHash", channel, destination, "expiresAt", attempts, used, "ipAddress", "createdAt")
       VALUES ($1, $2, $3, $4, $5, $6, 0, FALSE, $7, NOW())`,
      [crypto.randomUUID(), user.id, otpHash, channel, masked, expiresAt, ip]
    )

    // Deliver
    const delivery = await deliverOtp(channel, destination, otp, user.name || 'there')

    // Audit
    await logAuthEvent(user.id, 'PASSWORD_RESET_REQUESTED', ip, ua, { identifier, channel, delivered: delivery.delivered })

    return NextResponse.json({
      success: true,
      message: GENERIC_MESSAGE,
      channel,
      destination: masked,
      expiresInSeconds: OTP_TTL_MINUTES * 60,
      delivered: delivery.delivered,
    })
  } catch (error) {
    console.error('password-reset/request error:', error)
    return NextResponse.json({ error: 'Unable to process request' }, { status: 500 })
  }
}