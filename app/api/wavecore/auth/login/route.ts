import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, 'Password is required'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validated = loginSchema.parse(body)

    const user = await prisma.user.findUnique({
      where: { email: validated.email },
      include: { organizations: { include: { subscription: true } } }
    })

    if (!user) {
      return NextResponse.json({ success: false, error: 'Invalid email or password' }, { status: 401 })
    }

    const passwordMatch = await bcrypt.compare(validated.password, user.password)
    if (!passwordMatch) {
      return NextResponse.json({ success: false, error: 'Invalid email or password' }, { status: 401 })
    }

    // Update last login
    await prisma.user.update({ where: { id: user.id }, data: { lastLogin: new Date() } })

    return NextResponse.json({
      success: true,
      message: 'Login successful',
      data: {
        userId: user.id,
        name: user.name,
        email: user.email,
        organization: user.organizations[0],
        subscription: user.organizations[0]?.subscription,
      }
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}