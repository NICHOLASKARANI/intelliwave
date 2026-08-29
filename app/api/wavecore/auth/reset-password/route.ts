export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { hash } from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, otp, newPassword } = body

    if (!token || !otp || !newPassword) {
      return NextResponse.json({ error: 'Token, OTP, and new password required' }, { status: 400 })
    }

    if (newPassword.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
    }

    // Verify user with reset token AND OTP
    const userResult = await pool.query(
      `SELECT id FROM "User" WHERE "resetToken" = $1 AND "otpCode" = $2 AND "otpExpiry" > NOW() AND "resetExpiry" > NOW()`,
      [token, otp]
    )

    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: 'Invalid or expired OTP' }, { status: 400 })
    }

    // Hash new password
    const hashedPassword = await hash(newPassword, 12)

    // Update password, clear OTP and reset token
    await pool.query(
      `UPDATE "User" SET password = $1, "otpCode" = NULL, "otpExpiry" = NULL, "resetToken" = NULL, "resetExpiry" = NULL, "updatedAt" = NOW() WHERE id = $2`,
      [hashedPassword, userResult.rows[0].id]
    )

    return NextResponse.json({ 
      success: true,
      message: 'Password reset successfully. Please sign in.'
    })
  } catch (error) {
    console.error('Reset password error:', error)
    return NextResponse.json({ error: 'Failed to reset password' }, { status: 500 })
  }
}