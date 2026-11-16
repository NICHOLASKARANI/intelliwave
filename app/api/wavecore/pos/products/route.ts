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
    const search = url.searchParams.get('search') || ''
    if (!organizationId) return NextResponse.json({ error: 'organizationId required' }, { status: 400 })

    const where: any = { organizationId }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
      ]
    }

    const products = await prisma.product.findMany({
      where,
      take: 200,
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        sku: true,
        price: true,
        stock: true,
        taxRate: true,
      },
    } as any)

    return NextResponse.json({ products })
  } catch (err) {
    console.error('[pos/products GET]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}