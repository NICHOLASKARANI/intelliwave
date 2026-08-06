import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const signupSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Valid email is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  phone: z.string().optional(),
  organizationName: z.string().min(2, 'Organization name is required'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validated = signupSchema.parse(body)

    // Check existing user
    const existingUser = await prisma.user.findUnique({ where: { email: validated.email } })
    if (existingUser) {
      return NextResponse.json({ success: false, error: 'Email already registered' }, { status: 400 })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(validated.password, 12)

    // Create user with organization and trial subscription
    const user = await prisma.user.create({
      data: {
        name: validated.name,
        email: validated.email,
        password: hashedPassword,
        phone: validated.phone,
        organizations: {
          create: {
            name: validated.organizationName,
            trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days trial
            subscription: {
              create: {
                plan: 'TRIAL',
                status: 'TRIAL',
                amount: 500,
                trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
              }
            }
          }
        }
      },
      include: { organizations: { include: { subscription: true } } }
    })

    return NextResponse.json({
      success: true,
      message: 'Account created successfully. Your 30-day free trial has started.',
      data: {
        userId: user.id,
        name: user.name,
        email: user.email,
        organization: user.organizations[0],
        trialEndsAt: user.organizations[0].trialEndsAt,
      }
    }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}