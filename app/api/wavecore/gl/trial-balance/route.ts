import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organizationId')
    const asOfDate = searchParams.get('asOfDate') || new Date().toISOString()

    // Get all accounts with their balances
    const accounts = await prisma.chartOfAccount.findMany({
      where: { organizationId: organizationId || undefined, isActive: true },
      include: {
        journalItems: {
          where: {
            journalEntry: {
              date: { lte: new Date(asOfDate) },
              status: 'POSTED',
            },
          },
        },
      },
      orderBy: { code: 'asc' },
    })

    // Calculate balances
    const trialBalance = accounts.map(account => {
      const totalDebit = account.journalItems.reduce((sum, item) => sum + item.debit, 0)
      const totalCredit = account.journalItems.reduce((sum, item) => sum + item.credit, 0)

      let balance = 0
      if (['ASSET', 'EXPENSE'].includes(account.type)) {
        balance = totalDebit - totalCredit
      } else {
        balance = totalCredit - totalDebit
      }

      return {
        code: account.code,
        name: account.name,
        type: account.type,
        debit: totalDebit,
        credit: totalCredit,
        balance,
      }
    })

    const totalDebit = trialBalance.reduce((sum, a) => sum + a.debit, 0)
    const totalCredit = trialBalance.reduce((sum, a) => sum + a.credit, 0)

    return NextResponse.json({
      success: true,
      data: {
        accounts: trialBalance,
        summary: { totalDebit, totalCredit, difference: totalDebit - totalCredit },
        asOfDate,
      },
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}