export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { pool } from '@/lib/wavecore/db'
import { hashOtp, logAuthEvent, OTP_MAX_ATTEMPTS } from '@/lib/wavecore/auth/otp'

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    const ua = req.headers.get('user-agent') || 'unknown'
    const body = await req.json()
    const identifier = String(body?.identifier || '').trim()
    const otp = String(body?.otp || '').trim()

    if (!identifier || !/^\d{6}$/.test(otp)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    const isEmail = identifier.includes('@')
    const normalized = isEmail ? identifier.toLowerCase() : identifier.replace(/[\s-]/g, '')

    const userQuery = isEmail
      ? 'SELECT id FROM "User" WHERE LOWER(email) = $1 LIMIT 1'
      : 'SELECT id FROM "User" WHERE phone = $1 LIMIT 1'
    const userRes = await pool.query(userQuery, [normalized])

    // Uniform error to avoid enumeration
    const invalid = () =>
      NextResponse.json({ verified: false, error: 'Invalid or expired verification code' }, { status: 400 })

    if (userRes.rows.length === 0) {
      await logAuthEvent(null, 'PASSWORD_RESET_OTP_FAILED', ip, ua, { identifier, reason: 'no_user' })
      return invalid()
    }

    const userId = userRes.rows[0].id

    // Find latest active OTP
    const otpRes = await pool.query(
      `SELECT id, "otpHash", "expiresAt", attempts, used, "invalidatedAt"
       FROM "PasswordResetOtp"
       WHERE "userId" = $1 AND used = FALSE AND "invalidatedAt" IS NULL
       ORDER BY "createdAt" DESC LIMIT 1`,
      [userId]
    )

    if (otpRes.rows.length === 0) {
      await logAuthEvent(userId, 'PASSWORD_RESET_OTP_FAILED', ip, ua, { reason: 'no_active_otp' })
      return invalid()
    }

    const row = otpRes.rows[0]

    if (new Date(row.expiresAt).getTime() < Date.now()) {
      await pool.query(`UPDATE "PasswordResetOtp" SET "invalidatedAt" = NOW() WHERE id = $1`, [row.id])
      await logAuthEvent(userId, 'PASSWORD_RESET_OTP_FAILED', ip, ua, { reason: 'expired' })
      return invalid()
    }

    if (row.attempts >= OTP_MAX_ATTEMPTS) {
      await pool.query(`UPDATE "PasswordResetOtp" SET "invalidatedAt" = NOW() WHERE id = $1`, [row.id])
      await logAuthEvent(userId, 'PASSWORD_RESET_OTP_FAILED', ip, ua, { reason: 'attempts_exceeded' })
      return invalid()
    }

    const submittedHash = hashOtp(otp)
    const matches = submittedHash === row.otpHash

    if (!matches) {
      await pool.query(`UPDATE "PasswordResetOtp" SET attempts = attempts + 1 WHERE id = $1`, [row.id])
      await logAuthEvent(userId, 'PASSWORD_RESET_OTP_FAILED', ip, ua, { reason: 'mismatch' })
      return invalid()
    }

    // Mark OTP used, generate short-lived reset token (15 min)
    const resetToken = crypto.randomBytes(32).toString('hex')
    const resetHash = crypto.createHash('sha256').update(resetToken).digest('hex')
    const resetExpiry = new Date(Date.now() + 15 * 60 * 1000)

    await pool.query(
      `UPDATE "PasswordResetOtp" SET used = TRUE WHERE id = $1`,
      [row.id]
    )

    await pool.query(
      `UPDATE "User" SET "resetToken" = $1, "resetExpiry" = $2, "updatedAt" = NOW() WHERE id = $3`,
      [resetHash, resetExpiry, userId]
    )

    await logAuthEvent(userId, 'PASSWORD_RESET_OTP_VERIFIED', ip, ua, {})

    return NextResponse.json({
      verified: true,
      resetToken,
      expiresInSeconds: 15 * 60,
    })
  } catch (error) {
    console.error('password-reset/verify error:', error)
    return NextResponse.json({ error: 'Unable to verify' }, { status: 500 })
  }
}