import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const cookie = req.cookies.get('wavecore_session')?.value
    if (!cookie) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const url = new URL(req.url)
    const organizationId = url.searchParams.get('organizationId')
    if (!organizationId) return NextResponse.json({ error: 'organizationId required' }, { status: 400 })

    const sessions = await prisma.posSession.findMany({
      where: { organizationId },
      orderBy: { openedAt: 'desc' },
      take: 100,
    })
    return NextResponse.json({ sessions })
  } catch (err) {
    console.error('[pos/sessions GET]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}