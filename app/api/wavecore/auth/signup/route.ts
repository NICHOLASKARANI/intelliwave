export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { Pool } from 'pg'
import crypto from 'crypto'
import { rateLimit, getClientIP } from '@/lib/wavecore/rate-limit'
import { Errors } from '@/lib/wavecore/errors'
import { sendEmail } from '@/lib/wavecore/email'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('neon.tech') ? { rejectUnauthorized: false } : undefined,
})

const signupSchema = z.object({
  name: z.string().min(2, 'Full name is required'),
  email: z.string().email('Valid email is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  organizationName: z.string().min(2, 'Organization name is required'),
})

export async function POST(request: NextRequest) {
  const client = await pool.connect()
  try {
    // Rate limiting: 3 signups per hour per IP
    const ip = getClientIP(request)
    const rl = rateLimit(`signup:${ip}`, 3, 60 * 60 * 1000)

    if (!rl.success) {
      return Errors.rateLimited(Math.ceil((rl.resetAt - Date.now()) / 1000))
    }

    const body = await request.json()
    const validated = signupSchema.parse(body)
    const normalizedEmail = validated.email.toLowerCase().trim()
    const hashedPassword = await bcrypt.hash(validated.password, 12)

    await client.query('BEGIN')

    const existing = await client.query('SELECT id FROM "User" WHERE email = $1', [normalizedEmail])
    if (existing.rows.length > 0) {
      await client.query('ROLLBACK')
      return Errors.conflict('An account with this email already exists')
    }

    const userId = crypto.randomBytes(12).toString('hex')
    const orgId = crypto.randomBytes(12).toString('hex')
    const subId = crypto.randomBytes(12).toString('hex')
    const trialEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

    await client.query(
      'INSERT INTO "User" (id, name, email, password, role, "isActive", "createdAt", "updatedAt") VALUES ($1,$2,$3,$4,$5,$6,NOW(),NOW())',
      [userId, validated.name, normalizedEmail, hashedPassword, 'OWNER', true]
    )

    await client.query(
      'INSERT INTO "Organization" (id, name, "ownerId", "isActive", "trialEndsAt", "createdAt", "updatedAt") VALUES ($1,$2,$3,$4,$5,NOW(),NOW())',
      [orgId, validated.organizationName, userId, true, trialEnd]
    )

    await client.query(
      'INSERT INTO "_OrganizationMembers" ("A", "B") VALUES ($1, $2)',
      [orgId, userId]
    )

    await client.query(
      'INSERT INTO "Subscription" (id, plan, status, amount, currency, "trialEndsAt", "organizationId", "createdAt", "updatedAt") VALUES ($1,$2,$3,$4,$5,$6,$7,NOW(),NOW())',
      [subId, 'TRIAL', 'TRIAL', 500, 'KES', trialEnd, orgId]
    )

    // Create welcome notification
    await client.query(
      `INSERT INTO "Notification" (id, "userId", "organizationId", type, title, content, "isRead", "createdAt")
       VALUES (gen_random_uuid()::text, $1, $2, 'SYSTEM', $3, $4, false, NOW())`,
      [userId, orgId, 'Welcome to WaveCore ERP!', `Your ${validated.organizationName} workspace is ready. 30-day free trial started.`]
    )

    await client.query('COMMIT')

    // Send welcome email (async, non-blocking)
    sendEmail({
      to: normalizedEmail,
      subject: `Welcome to WaveCore ERP, ${validated.name}!`,
      text: `Your organization ${validated.organizationName} is ready. Your 30-day free trial has started.`,
      html: `<h1>Welcome to WaveCore ERP!</h1><p>Hi ${validated.name},</p><p>Your organization <strong>${validated.organizationName}</strong> is ready.</p><p>Your <strong>30-day free trial</strong> has started.</p><p>After your trial, it's KSh 500/month.</p>`,
      userId,
      organizationId: orgId,
    }).catch(err => console.error('Welcome email failed:', err))

    return NextResponse.json({
      success: true,
      message: 'Account created! 30-day free trial started.',
      data: { userId, name: validated.name, email: normalizedEmail, organization: { id: orgId, name: validated.organizationName } },
    }, { status: 201 })
  } catch (error: any) {
    await client.query('ROLLBACK').catch(() => {})
    if (error instanceof z.ZodError) {
      return Errors.validation(error.errors)
    }
    console.error('Signup error:', error.message)
    return Errors.internal()
  } finally {
    client.release()
  }
}