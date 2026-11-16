import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const cookie = req.cookies.get('wavecore_session')?.value
    if (!cookie) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { closingCash, notes } = body

    const session = await prisma.posSession.findUnique({ where: { id: params.id } })
    if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    if (session.status === 'CLOSED') return NextResponse.json({ error: 'Already closed' }, { status: 400 })

    // Compute expected cash: opening + all cash sales in session
    const cashSales = await prisma.posSale.aggregate({
      where: { sessionId: params.id, paymentMethod: 'CASH' },
      _sum: { total: true, changeGiven: true },
    })
    const cashReceived = Number(cashSales._sum.total || 0) - Number(cashSales._sum.changeGiven || 0)
    const expectedCash = Number(session.openingCash) + cashReceived
    const closingCashNum = Number(closingCash) || 0
    const variance = closingCashNum - expectedCash

    const updated = await prisma.posSession.update({
      where: { id: params.id },
      data: {
        closingCash: closingCashNum,
        expectedCash,
        cashVariance: variance,
        status: 'CLOSED',
        closedAt: new Date(),
        notes: notes || null,
      },
    })
    return NextResponse.json({ session: updated })
  } catch (err) {
    console.error('[pos/sessions/close]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}