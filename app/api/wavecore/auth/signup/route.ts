export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { Pool } from 'pg'
import crypto from 'crypto'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://wavecore:wavecore123@127.0.0.1:5432/intelliwave",
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
    const body = await request.json()
    const validated = signupSchema.parse(body)
    const normalizedEmail = validated.email.toLowerCase().trim()
    const hashedPassword = await bcrypt.hash(validated.password, 12)

    await client.query('BEGIN')

    const existing = await client.query('SELECT id FROM "User" WHERE email = $1', [normalizedEmail])
    if (existing.rows.length > 0) {
      await client.query('ROLLBACK')
      return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 })
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

    await client.query('COMMIT')

    return NextResponse.json({
      success: true,
      message: 'Account created! 30-day free trial started.',
      data: { userId, name: validated.name, email: normalizedEmail, organization: { id: orgId, name: validated.organizationName } },
    }, { status: 201 })
  } catch (error: any) {
    await client.query('ROLLBACK')
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 422 })
    }
    console.error('Signup error:', error.message)
    return NextResponse.json({ error: 'Unable to create account. Please try again.' }, { status: 500 })
  } finally {
    client.release()
  }
}