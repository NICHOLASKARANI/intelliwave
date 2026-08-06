import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'

const prisma = new PrismaClient()

// Validation schema
const journalEntrySchema = z.object({
  date: z.string(),
  reference: z.string().optional(),
  description: z.string().min(1, 'Description is required'),
  fiscalPeriodId: z.string(),
  organizationId: z.string(),
  items: z.array(z.object({
    accountId: z.string(),
    description: z.string().optional(),
    debit: z.number().min(0),
    credit: z.number().min(0),
  })).min(2, 'At least 2 items required'),
})

// GET /api/wavecore/gl/journal-entries
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organizationId')
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const where: any = {}
    if (organizationId) where.organizationId = organizationId
    if (status) where.status = status

    const [entries, total] = await Promise.all([
      prisma.journalEntry.findMany({
        where,
        include: {
          items: { include: { account: true } },
          fiscalPeriod: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.journalEntry.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: entries,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// POST /api/wavecore/gl/journal-entries
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validated = journalEntrySchema.parse(body)

    // Validate debits = credits
    const totalDebit = validated.items.reduce((sum, item) => sum + item.debit, 0)
    const totalCredit = validated.items.reduce((sum, item) => sum + item.credit, 0)
    
    if (Math.abs(totalDebit - totalCredit) > 0.001) {
      return NextResponse.json({
        success: false,
        error: `Debits (${totalDebit}) must equal Credits (${totalCredit})`,
      }, { status: 400 })
    }

    // Generate entry number
    const count = await prisma.journalEntry.count({
      where: { organizationId: validated.organizationId },
    })
    const number = `JE/${new Date().getFullYear()}/${String(count + 1).padStart(4, '0')}`

    const entry = await prisma.journalEntry.create({
      data: {
        number,
        date: new Date(validated.date),
        reference: validated.reference,
        description: validated.description,
        amount: totalDebit,
        fiscalPeriodId: validated.fiscalPeriodId,
        organizationId: validated.organizationId,
        items: {
          create: validated.items.map(item => ({
            accountId: item.accountId,
            description: item.description,
            debit: item.debit,
            credit: item.credit,
          })),
        },
      },
      include: {
        items: { include: { account: true } },
      },
    })

    // Audit log
    await prisma.auditLog.create({
      data: {
        action: 'CREATE',
        entityType: 'JournalEntry',
        entityId: entry.id,
        journalEntryId: entry.id,
        changes: JSON.stringify(entry),
      },
    })

    return NextResponse.json({ success: true, data: entry }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}