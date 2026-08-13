export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { pool } from '@/lib/wavecore/db'

const forgotPasswordSchema = z.object({
  email: z.string().email(),
})

const resetPasswordSchema = z.object({
  token: z.string(),
  password: z.string().min(8),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validated = forgotPasswordSchema.parse(body)
    const normalizedEmail = validated.email.toLowerCase().trim()

    const user = await pool.query('SELECT id FROM "User" WHERE email = $1', [normalizedEmail])

    if (user.rows.length === 0) {
      // Return same message to prevent account enumeration
      return NextResponse.json({ success: true, message: 'If an account exists, a reset link has been sent' })
    }

    const resetToken = crypto.randomBytes(32).toString('hex')
    const resetExpiry = new Date(Date.now() + 60 * 60 * 1000)

    await pool.query(
      'UPDATE "User" SET "resetToken" = $1, "resetExpiry" = $2 WHERE id = $3',
      [resetToken, resetExpiry, user.rows[0].id]
    )

    // In production, send email with reset link
    return NextResponse.json({ success: true, message: 'Reset link sent' })
  } catch (error) {
    console.error('ForgotPassword error:', error)
    return NextResponse.json({ error: 'Unable to process request' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const validated = resetPasswordSchema.parse(body)

    const user = await pool.query(
      'SELECT id FROM "User" WHERE "resetToken" = $1 AND "resetExpiry" > NOW()',
      [validated.token]
    )

    if (user.rows.length === 0) {
      return NextResponse.json({ error: 'Invalid or expired reset token' }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(validated.password, 12)

    await pool.query(
      'UPDATE "User" SET password = $1, "resetToken" = NULL, "resetExpiry" = NULL WHERE id = $2',
      [hashedPassword, user.rows[0].id]
    )

    return NextResponse.json({ success: true, message: 'Password reset successfully' })
  } catch (error) {
    console.error('ResetPassword error:', error)
    return NextResponse.json({ error: 'Unable to reset password' }, { status: 500 })
  }
}