export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { hash } from 'bcryptjs'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { userId, newPassword } = body

    if (!userId || !newPassword) {
      return NextResponse.json({ error: 'User ID and new password required' }, { status: 400 })
    }

    // Validate password strength
    if (newPassword.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
    }

    // Hash the new password
    const hashedPassword = await hash(newPassword, 10)

    // Update user password
    const result = await pool.query(
      `UPDATE "User" SET password = $1, "updatedAt" = NOW() WHERE id = $2 RETURNING id, email`,
      [hashedPassword, userId]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Revoke all existing sessions for security
    await pool.query(`DELETE FROM "Session" WHERE "userId" = $1`, [userId])
    await pool.query(`DELETE FROM "SecuritySession" WHERE "userId" = $1`, [userId])

    return NextResponse.json({ success: true, user: result.rows[0] })
  } catch (error) {
    console.error('Reset password error:', error)
    return NextResponse.json({ error: 'Failed to reset password: ' + (error as Error).message }, { status: 500 })
  }
}