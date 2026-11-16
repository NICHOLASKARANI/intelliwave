import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function isAuthorized(req: NextRequest): boolean {
  const cookie = req.cookies.get('wavecore_role')?.value
  const adminPassword = req.headers.get('x-admin-password')
  const envPassword = process.env.NUCLEAR_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD

  if (adminPassword && envPassword && adminPassword === envPassword) return true
  if (cookie === 'OWNER' || cookie === 'TENANT_ADMIN') return true
  return false
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json().catch(() => ({}))
    const note = body.note || 'Could not verify transaction reference'

    const payment = await prisma.pendingBankPayment.update({
      where: { id: params.id },
      data: {
        status: 'REJECTED',
        rejectionNote: note,
        approvedAt: new Date(),
      },
    })

    return NextResponse.json({ ok: true, payment })
  } catch (err) {
    console.error('[bank-reject] error:', err)
    return NextResponse.json({ error: 'Could not reject payment' }, { status: 500 })
  }
}