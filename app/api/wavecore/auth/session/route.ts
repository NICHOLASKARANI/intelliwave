export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/wavecore/auth'
import { prisma } from '@/lib/wavecore/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ authenticated: false }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        image: true,
        isActive: true,
      },
    })

    const organization = await prisma.organization.findUnique({
      where: { id: session.organizationId },
      select: {
        id: true,
        name: true,
        isActive: true,
        trialEndsAt: true,
        subscription: true,
      },
    })

    return NextResponse.json({
      authenticated: true,
      user,
      organization,
      permissions: session.permissions,
    })
  } catch (error) {
    console.error('Session error:', error)
    return NextResponse.json({ authenticated: false }, { status: 500 })
  }
}