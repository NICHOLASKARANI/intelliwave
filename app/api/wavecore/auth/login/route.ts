export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { Pool } from 'pg'
import crypto from 'crypto'
import { rateLimit, getClientIP } from '@/lib/wavecore/rate-limit'
import { Errors } from '@/lib/wavecore/errors'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('neon.tech') ? { rejectUnauthorized: false } : undefined,
})

const loginSchema = z.object({
  email: z.string().email('Valid email is required'),
  password: z.string().min(1, 'Password is required'),
})

export async function POST(request: NextRequest) {
  const client = await pool.connect()
  try {
    // Rate limiting: 5 attempts per 15 minutes per IP
    const ip = getClientIP(request)
    const rl = rateLimit(`login:${ip}`, 5, 15 * 60 * 1000)

    if (!rl.success) {
      return Errors.rateLimited(Math.ceil((rl.resetAt - Date.now()) / 1000))
    }

    const body = await request.json()
    const validated = loginSchema.parse(body)
    const normalizedEmail = validated.email.toLowerCase().trim()

    const result = await client.query(
      'SELECT u.id, u.name, u.email, u.password, u.role, u."isActive", ' +
      'o.id as org_id, o.name as org_name, o."isActive" as org_active, ' +
      's.id as sub_id, s.plan, s.status as sub_status, s."trialEndsAt" ' +
      'FROM "User" u ' +
      'JOIN "_OrganizationMembers" om ON om."B" = u.id ' +
      'JOIN "Organization" o ON o.id = om."A" ' +
      'LEFT JOIN "Subscription" s ON s."organizationId" = o.id ' +
      'WHERE u.email = $1',
      [normalizedEmail]
    )

    if (result.rows.length === 0) {
      return Errors.unauthorized()
    }

    const user = result.rows[0]
    if (!user.password || !(await bcrypt.compare(validated.password, user.password))) {
      return Errors.unauthorized()
    }
    if (!user.isActive) {
      return apiError(403, 'Account is disabled')
    }
    if (!user.org_active) {
      return apiError(403, 'Organization is suspended')
    }

    await client.query('UPDATE "User" SET "lastLogin" = NOW() WHERE id = $1', [user.id])

    const sessionToken = crypto.randomBytes(64).toString('hex')
    await client.query(
      'INSERT INTO "Session" (id, "sessionToken", "userId", expires) VALUES ($1, $2, $3, $4)',
      [crypto.randomBytes(12).toString('hex'), sessionToken, user.id, new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)]
    )

    const response = NextResponse.json({
      success: true,
      message: 'Login successful',
      data: {
        userId: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        organization: { id: user.org_id, name: user.org_name },
        subscription: user.sub_id ? { plan: user.plan, status: user.sub_status } : null,
      },
    })

    response.cookies.set('wavecore_session', sessionToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    })

    return response
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return Errors.validation(error.errors)
    }
    console.error('Login error:', error.message)
    return Errors.internal()
  } finally {
    client.release()
  }
}

function apiError(status: number, message: string) {
  return NextResponse.json({ error: message }, { status })
}