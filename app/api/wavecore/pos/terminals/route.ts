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

    const terminals = await prisma.posTerminal.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ terminals })
  } catch (err) {
    console.error('[pos/terminals GET]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const cookie = req.cookies.get('wavecore_session')?.value
    if (!cookie) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { organizationId, name, location } = body
    if (!organizationId || !name) return NextResponse.json({ error: 'organizationId and name required' }, { status: 400 })

    const terminal = await prisma.posTerminal.create({
      data: { organizationId, name, location: location || null, isActive: true },
    })
    return NextResponse.json({ terminal }, { status: 201 })
  } catch (err) {
    console.error('[pos/terminals POST]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}