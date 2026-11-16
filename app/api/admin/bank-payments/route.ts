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

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const status = new URL(req.url).searchParams.get('status') || 'PENDING'

  const payments = await prisma.pendingBankPayment.findMany({
    where: status === 'ALL' ? {} : { status },
    orderBy: { createdAt: 'desc' },
    take: 200,
  })

  const counts = {
    pending: await prisma.pendingBankPayment.count({ where: { status: 'PENDING' } }),
    approved: await prisma.pendingBankPayment.count({ where: { status: 'APPROVED' } }),
    rejected: await prisma.pendingBankPayment.count({ where: { status: 'REJECTED' } }),
  }

  return NextResponse.json({ payments, counts })
}