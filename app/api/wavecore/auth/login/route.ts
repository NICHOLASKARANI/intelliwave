export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/wavecore/prisma'
import { createSession } from '@/lib/wavecore/auth'

const loginSchema = z.object({
  email: z.string().email('Valid email is required'),
  password: z.string().min(1, 'Password is required'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validated = loginSchema.parse(body)

    const normalizedEmail = validated.email.toLowerCase().trim()

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: {
        membermemberOrganizations: {
          include: { subscription: true },
        },
      },
    })

    if (!user || !user.password) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    if (!user.isActive) {
      return NextResponse.json(
        { error: 'Account is disabled. Contact support.' },
        { status: 403 }
      )
    }

    const passwordMatch = await bcrypt.compare(validated.password, user.password)
    if (!passwordMatch) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    const activeOrg = user.membermemberOrganizations[0]
    if (!activeOrg) {
      return NextResponse.json(
        { error: 'No organization found. Contact support.' },
        { status: 403 }
      )
    }

    if (!activeOrg.isActive) {
      return NextResponse.json(
        { error: 'Organization is suspended. Contact support.' },
        { status: 403 }
      )
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    })

    await createSession(user.id, activeOrg.id)

    await prisma.auditLog.create({
      data: {
        action: 'LOGIN',
        entityType: 'User',
        entityId: user.id,
        userId: user.id,
        changes: JSON.stringify({ email: user.email }),
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Login successful',
      data: {
        userId: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        organization: {
          id: activeOrg.id,
          name: activeOrg.name,
        },
        subscription: activeOrg.subscription,
      },
    })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 422 }
      )
    }
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}