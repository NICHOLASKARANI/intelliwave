import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const cookie = req.cookies.get('wavecore_session')?.value
    if (!cookie) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { organizationId, terminalId, cashierId, cashierName, openingCash } = body
    if (!organizationId || !terminalId || !cashierId) {
      return NextResponse.json({ error: 'organizationId, terminalId, cashierId required' }, { status: 400 })
    }

    // Check if there is already an open session on this terminal
    const existing = await prisma.posSession.findFirst({
      where: { terminalId, status: 'OPEN' },
    })
    if (existing) {
      return NextResponse.json({ error: 'Terminal already has an open session', session: existing }, { status: 409 })
    }

    const session = await prisma.posSession.create({
      data: {
        organizationId,
        terminalId,
        cashierId,
        cashierName: cashierName || null,
        openingCash: Number(openingCash) || 0,
        status: 'OPEN',
      },
    })
    return NextResponse.json({ session }, { status: 201 })
  } catch (err) {
    console.error('[pos/sessions/open]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}