export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { destroySession, getSession } from '@/lib/wavecore/auth'
import { prisma } from '@/lib/wavecore/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (session) {
      await prisma.auditLog.create({
        data: {
          action: 'LOGOUT',
          entityType: 'User',
          entityId: session.userId,
          userId: session.userId,
        },
      })
    }

    await destroySession()

    return NextResponse.json({ success: true, message: 'Logged out successfully' })
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}