import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function makeReceiptNumber() {
  const d = new Date()
  const ymd = d.getFullYear().toString() + String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0')
  const rand = Math.floor(Math.random() * 100000).toString().padStart(5, '0')
  return 'POS-' + ymd + '-' + rand
}

export async function GET(req: NextRequest) {
  try {
    const cookie = req.cookies.get('wavecore_session')?.value
    if (!cookie) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const url = new URL(req.url)
    const organizationId = url.searchParams.get('organizationId')
    const sessionId = url.searchParams.get('sessionId')
    const from = url.searchParams.get('from')
    const to = url.searchParams.get('to')
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '100'), 500)

    if (!organizationId) return NextResponse.json({ error: 'organizationId required' }, { status: 400 })

    const where: any = { organizationId }
    if (sessionId) where.sessionId = sessionId
    if (from || to) {
      where.createdAt = {}
      if (from) where.createdAt.gte = new Date(from)
      if (to) where.createdAt.lte = new Date(to)
    }

    const sales = await prisma.posSale.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    const totalResult = await prisma.posSale.aggregate({
      where,
      _sum: { total: true },
      _count: true,
    })

    return NextResponse.json({
      sales,
      totalAmount: totalResult._sum.total || 0,
      count: totalResult._count,
    })
  } catch (err) {
    console.error('[pos/sales GET]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const cookie = req.cookies.get('wavecore_session')?.value
    if (!cookie) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const {
      organizationId, terminalId, sessionId, cashierId, customerId,
      paymentMethod, paymentReference, changeGiven, items, discountAmount, notes,
    } = body

    if (!organizationId || !terminalId || !sessionId || !cashierId || !paymentMethod || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Missing required fields or empty cart' }, { status: 400 })
    }

    // Compute totals from items
    let subtotal = 0
    let taxAmount = 0
    const preparedItems = items.map((item: any) => {
      const qty = Number(item.quantity) || 0
      const price = Number(item.unitPrice) || 0
      const taxRate = Number(item.taxRate) || 0
      const lineTotal = qty * price
      const lineTax = lineTotal * (taxRate / 100)
      subtotal += lineTotal
      taxAmount += lineTax
      return {
        productId: item.productId || null,
        productName: item.productName || 'Item',
        sku: item.sku || null,
        quantity: qty,
        unitPrice: price,
        taxRate,
        lineTotal,
      }
    })

    const discount = Number(discountAmount) || 0
    const total = subtotal + taxAmount - discount

    const sale = await prisma.posSale.create({
      data: {
        organizationId,
        terminalId,
        sessionId,
        receiptNumber: makeReceiptNumber(),
        cashierId,
        customerId: customerId || null,
        subtotal,
        taxAmount,
        discountAmount: discount,
        total,
        paymentMethod,
        paymentReference: paymentReference || null,
        changeGiven: Number(changeGiven) || 0,
        notes: notes || null,
        items: { create: preparedItems },
      } as any,
    })

    return NextResponse.json({ sale }, { status: 201 })
  } catch (err) {
    console.error('[pos/sales POST]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}