import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'

const prisma = new PrismaClient()

const accountSchema = z.object({
  code: z.string().min(1, 'Account code is required'),
  name: z.string().min(1, 'Account name is required'),
  type: z.enum(['ASSET', 'LIABILITY', 'EQUITY', 'INCOME', 'EXPENSE']),
  parentId: z.string().optional(),
  isReconcilable: z.boolean().default(false),
  description: z.string().optional(),
  organizationId: z.string(),
})

// GET all accounts
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organizationId')
    const type = searchParams.get('type')

    const where: any = {}
    if (organizationId) where.organizationId = organizationId
    if (type) where.type = type

    const accounts = await prisma.chartOfAccount.findMany({
      where,
      include: { children: true },
      orderBy: { code: 'asc' },
    })

    return NextResponse.json({ success: true, data: accounts })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// POST create account
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validated = accountSchema.parse(body)

    // Check code uniqueness
    const existing = await prisma.chartOfAccount.findUnique({
      where: { code: validated.code },
    })
    if (existing) {
      return NextResponse.json({ success: false, error: 'Account code already exists' }, { status: 400 })
    }

    const account = await prisma.chartOfAccount.create({
      data: validated,
    })

    await prisma.auditLog.create({
      data: {
        action: 'CREATE',
        entityType: 'ChartOfAccount',
        entityId: account.id,
        changes: JSON.stringify(account),
      },
    })

    return NextResponse.json({ success: true, data: account }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}