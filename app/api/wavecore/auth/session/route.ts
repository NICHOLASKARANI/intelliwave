export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/wavecore/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ authenticated: false }, { status: 401 })
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: session.userId,
        name: session.name,
        email: session.email,
        role: session.role,
      },
      organization: {
        id: session.organizationId,
        name: session.orgName,
      },
      permissions: [],
    })
  } catch (error) {
    console.error('Session API error:', error)
    return NextResponse.json({ authenticated: false }, { status: 500 })
  }
}