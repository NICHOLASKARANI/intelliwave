import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET single account
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const account = await prisma.chartOfAccount.findUnique({
      where: { id: params.id },
      include: { children: true, parent: true, journalItems: true },
    })
    if (!account) {
      return NextResponse.json({ success: false, error: 'Account not found' }, { status: 404 })
    }
    return NextResponse.json({ success: true, data: account })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// PUT update account
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const account = await prisma.chartOfAccount.update({
      where: { id: params.id },
      data: {
        name: body.name,
        type: body.type,
        isReconcilable: body.isReconcilable,
        description: body.description,
        isActive: body.isActive,
      },
    })

    await prisma.auditLog.create({
      data: {
        action: 'UPDATE',
        entityType: 'ChartOfAccount',
        entityId: account.id,
        changes: JSON.stringify(body),
      },
    })

    return NextResponse.json({ success: true, data: account })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// DELETE account
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Check if account has journal entries
    const hasEntries = await prisma.journalItem.findFirst({
      where: { accountId: params.id },
    })
    if (hasEntries) {
      return NextResponse.json({ success: false, error: 'Cannot delete account with existing transactions' }, { status: 400 })
    }

    await prisma.chartOfAccount.delete({ where: { id: params.id } })

    await prisma.auditLog.create({
      data: {
        action: 'DELETE',
        entityType: 'ChartOfAccount',
        entityId: params.id,
      },
    })

    return NextResponse.json({ success: true, message: 'Account deleted' })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}