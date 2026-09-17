export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { hash } from 'bcryptjs'
import { pool } from '@/lib/wavecore/db'
import { logAuthEvent } from '@/lib/wavecore/auth/otp'

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    const ua = req.headers.get('user-agent') || 'unknown'
    const body = await req.json()
    const resetToken = String(body?.resetToken || '').trim()
    const newPassword = String(body?.newPassword || '')

    if (!resetToken || newPassword.length < 8) {
      return NextResponse.json({ error: 'Invalid request or password too short' }, { status: 400 })
    }

    const resetHash = crypto.createHash('sha256').update(resetToken).digest('hex')

    const userRes = await pool.query(
      `SELECT id FROM "User" WHERE "resetToken" = $1 AND "resetExpiry" > NOW() LIMIT 1`,
      [resetHash]
    )

    if (userRes.rows.length === 0) {
      return NextResponse.json({ error: 'Reset link invalid or expired' }, { status: 400 })
    }

    const userId = userRes.rows[0].id
    const passwordHash = await hash(newPassword, 12)

    await pool.query(
      `UPDATE "User"
       SET password = $1, "resetToken" = NULL, "resetExpiry" = NULL,
           "otpCode" = NULL, "otpExpiry" = NULL, "updatedAt" = NOW()
       WHERE id = $2`,
      [passwordHash, userId]
    )

    // Invalidate all sessions for this user (force re-login)
    await pool.query(`DELETE FROM "Session" WHERE "userId" = $1`, [userId])

    await logAuthEvent(userId, 'PASSWORD_RESET_COMPLETED', ip, ua, {})

    return NextResponse.json({ success: true, message: 'Password updated. Please sign in.' })
  } catch (error) {
    console.error('password-reset/complete error:', error)
    return NextResponse.json({ error: 'Unable to update password' }, { status: 500 })
  }
}