import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { planId, amount, txnRef, exec, email, payerName, bankName } = body

    if (!planId || !amount || !txnRef) {
      return NextResponse.json(
        { error: 'Missing required fields: planId, amount, txnRef' },
        { status: 400 }
      )
    }

    if (typeof txnRef !== 'string' || txnRef.length < 6 || txnRef.length > 64) {
      return NextResponse.json(
        { error: 'Transaction reference must be 6–64 characters' },
        { status: 400 }
      )
    }

    if (typeof amount !== 'number' || amount < 100) {
      return NextResponse.json(
        { error: 'Amount must be at least KES 100' },
        { status: 400 }
      )
    }

    // Check for duplicate txnRef
    const existing = await prisma.pendingBankPayment.findUnique({
      where: { txnReference: txnRef },
    })
    if (existing) {
      return NextResponse.json(
        { error: 'This transaction reference has already been submitted' },
        { status: 409 }
      )
    }

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null

    const record = await prisma.pendingBankPayment.create({
      data: {
        planId,
        amount,
        txnReference: txnRef,
        execId: exec || null,
        email: email || null,
        payerName: payerName || null,
        bankName: bankName || null,
        ipAddress: ip,
        status: 'PENDING',
      },
    })

    return NextResponse.json({
      ok: true,
      id: record.id,
      message: 'Payment submitted for approval. You will receive access within 10 minutes after CEO verification.',
    })
  } catch (err) {
    console.error('[bank-confirm] error:', err)
    return NextResponse.json({ error: 'Server error. Please try again.' }, { status: 500 })
  }
}