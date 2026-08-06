import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'

const prisma = new PrismaClient()

const forgotPasswordSchema = z.object({
  email: z.string().email(),
})

const resetPasswordSchema = z.object({
  token: z.string(),
  password: z.string().min(8),
})

// POST - Send reset link
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validated = forgotPasswordSchema.parse(body)

    const user = await prisma.user.findUnique({ where: { email: validated.email } })
    if (!user) {
      return NextResponse.json({ success: false, error: 'No account found with this email' }, { status: 404 })
    }

    // Generate reset token
    const resetToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
    const resetExpiry = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken, resetExpiry }
    })

    return NextResponse.json({
      success: true,
      message: 'Password reset link sent to your email',
      resetToken // In production, send via email
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// PUT - Reset password
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const validated = resetPasswordSchema.parse(body)

    const user = await prisma.user.findFirst({
      where: { resetToken: validated.token, resetExpiry: { gt: new Date() } }
    })

    if (!user) {
      return NextResponse.json({ success: false, error: 'Invalid or expired reset token' }, { status: 400 })
    }

    const bcrypt = require('bcryptjs')
    const hashedPassword = await bcrypt.hash(validated.password, 12)

    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword, resetToken: null, resetExpiry: null }
    })

    return NextResponse.json({ success: true, message: 'Password reset successfully' })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}