import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { hash } from 'bcryptjs'
import { checkRedisRateLimit } from '@/lib/wavecore/security/redis-limiter'

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    const rateLimit = await checkRedisRateLimit('reset-password:' + ip, 3, 900)
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: 'Too many attempts. Try again later.' }, { status: 429 })
    }
  try {
    const body = await req.json()
    const { token, newPassword } = body

    if (!token || !newPassword) {
      return NextResponse.json({ error: 'Token and new password required' }, { status: 400 })
    }

    if (newPassword.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
    }

    // Find user by reset token
    const userResult = await pool.query(
      `SELECT id FROM "User" WHERE "resetToken" = $1 AND "resetExpiry" > NOW()`,
      [token]
    )

    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: 'Invalid or expired reset token' }, { status: 400 })
    }

    // Hash new password
    const hashedPassword = await hash(newPassword, 12)

    // Update password and clear reset token
    await pool.query(
      `UPDATE "User" SET password = $1, "resetToken" = NULL, "resetExpiry" = NULL, "updatedAt" = NOW() WHERE id = $2`,
      [hashedPassword, userResult.rows[0].id]
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Reset password error:', error)
    return NextResponse.json({ error: 'Failed to reset password' }, { status: 500 })
  }
}