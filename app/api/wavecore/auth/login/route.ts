export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { Pool } from 'pg'
import crypto from 'crypto'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://wavecore:wavecore123@localhost:5432/intelliwave",
})

const loginSchema = z.object({
  email: z.string().email('Valid email is required'),
  password: z.string().min(1, 'Password is required'),
})

export async function POST(request: NextRequest) {
  const client = await pool.connect()
  try {
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
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    const user = result.rows[0]
    if (!user.password || !(await bcrypt.compare(validated.password, user.password))) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }
    if (!user.isActive) {
      return NextResponse.json({ error: 'Account is disabled' }, { status: 403 })
    }
    if (!user.org_active) {
      return NextResponse.json({ error: 'Organization is suspended' }, { status: 403 })
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
      return NextResponse.json({ error: 'Validation failed' }, { status: 422 })
    }
    console.error('Login error:', error.message)
    return NextResponse.json({ error: 'Unable to sign in' }, { status: 500 })
  } finally {
    client.release()
  }
}