export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { Pool } from 'pg'
import { rateLimit, getClientIP } from '@/lib/wavecore/rate-limit'
import { sendEmail } from '@/lib/wavecore/email'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('neon.tech') ? { rejectUnauthorized: false } : undefined,
})

const forgotPasswordSchema = z.object({
  email: z.string().email(),
})

const resetPasswordSchema = z.object({
  token: z.string(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export async function POST(request: NextRequest) {
  try {
    // Rate limiting: 3 requests per hour per IP
    const ip = getClientIP(request)
    const rl = rateLimit(`forgot:${ip}`, 3, 60 * 60 * 1000)

    if (!rl.success) {
      return NextResponse.json(
        { error: 'Too many requests. Try again later.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } }
      )
    }

    const body = await request.json()
    const validated = forgotPasswordSchema.parse(body)
    const normalizedEmail = validated.email.toLowerCase().trim()

    const user = await pool.query('SELECT id, name FROM "User" WHERE email = $1', [normalizedEmail])

    // Always return the same response to prevent account enumeration
    const genericResponse = { success: true, message: 'If an account exists with this email, a reset link has been sent.' }

    if (user.rows.length === 0) {
      return NextResponse.json(genericResponse)
    }

    const resetToken = crypto.randomBytes(32).toString('hex')
    const resetExpiry = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    await pool.query(
      'UPDATE "User" SET "resetToken" = $1, "resetExpiry" = $2 WHERE id = $3',
      [resetToken, resetExpiry, user.rows[0].id]
    )

    // Send reset email (async)
    const resetUrl = `${process.env.NEXTAUTH_URL || 'https://www.intelliwavve.com'}/wavecore-erp/auth/reset-password?token=${resetToken}`

    sendEmail({
      to: normalizedEmail,
      subject: 'Reset your WaveCore password',
      text: `Click this link to reset your password: ${resetUrl}`,
      html: `<p>Hi ${user.rows[0].name || ''},</p><p>Click <a href="${resetUrl}">here</a> to reset your password.</p><p>This link expires in 1 hour.</p>`,
    }).catch(err => console.error('Reset email failed:', err))

    return NextResponse.json(genericResponse)
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 422 })
    }
    console.error('ForgotPassword error:', error.message)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
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

    // Optionally invalidate all sessions for this user
    await pool.query('DELETE FROM "Session" WHERE "userId" = $1', [user.rows[0].id])

    return NextResponse.json({ success: true, message: 'Password reset successfully. Please log in.' })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 422 })
    }
    console.error('ResetPassword error:', error.message)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}