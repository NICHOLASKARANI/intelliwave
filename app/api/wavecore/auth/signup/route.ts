export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/wavecore/prisma'
import { createSession } from '@/lib/wavecore/auth'

const signupSchema = z.object({
  name: z.string().min(2, 'Full name is required'),
  email: z.string().email('Valid email is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  organizationName: z.string().min(2, 'Organization name is required'),
  phone: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validated = signupSchema.parse(body)

    const normalizedEmail = validated.email.toLowerCase().trim()

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    })
    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      )
    }

    const hashedPassword = await bcrypt.hash(validated.password, 12)

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: validated.name,
          email: normalizedEmail,
          password: hashedPassword,
          phone: validated.phone,
          role: 'OWNER',
          isActive: true,
        },
      })

      const organization = await tx.organization.create({
        data: {
          name: validated.organizationName,
          ownerId: user.id,
          isActive: true,
          trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          members: {
            connect: { id: user.id },
          },
        },
      })

      const subscription = await tx.subscription.create({
        data: {
          plan: 'TRIAL',
          status: 'TRIAL',
          amount: 500,
          currency: 'KES',
          trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          organizationId: organization.id,
        },
      })

      await tx.auditLog.create({
        data: {
          action: 'SIGNUP',
          entityType: 'User',
          entityId: user.id,
          userId: user.id,
          changes: JSON.stringify({
            name: user.name,
            email: user.email,
            organization: organization.name,
          }),
        },
      })

      return { user, organization, subscription }
    })

    await createSession(result.user.id, result.organization.id)

    return NextResponse.json({
      success: true,
      message: 'Account created successfully. Your 30-day free trial has started!',
      data: {
        userId: result.user.id,
        name: result.user.name,
        email: result.user.email,
        organization: {
          id: result.organization.id,
          name: result.organization.name,
        },
        subscription: {
          plan: result.subscription.plan,
          status: result.subscription.status,
          trialEndsAt: result.subscription.trialEndsAt,
        },
      },
    }, { status: 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 422 }
      )
    }
    console.error('Signup error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}