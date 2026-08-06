import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'

const prisma = new PrismaClient()

const invoiceSchema = z.object({
  customerName: z.string().min(1, 'Customer name is required'),
  customerEmail: z.string().email().optional(),
  date: z.string(),
  dueDate: z.string(),
  reference: z.string().optional(),
  description: z.string().min(1, 'Description is required'),
  amount: z.number().positive('Amount must be positive'),
  taxAmount: z.number().min(0).default(0),
  status: z.enum(['DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED']).default('DRAFT'),
  organizationId: z.string(),
  lineItems: z.array(z.object({
    description: z.string(),
    quantity: z.number().positive(),
    unitPrice: z.number().positive(),
    accountId: z.string(),
  })).optional(),
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organizationId')
    const status = searchParams.get('status')

    // For now, return structured empty state
    const invoices: any[] = []

    return NextResponse.json({
      success: true,
      data: invoices,
      summary: {
        totalOutstanding: 0,
        totalOverdue: 0,
        totalPaid: 0,
        invoiceCount: 0,
      },
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validated = invoiceSchema.parse(body)

    // Generate invoice number
    const count = 0 // Replace with DB count
    const number = `INV/${new Date().getFullYear()}/${String(count + 1).padStart(4, '0')}`

    return NextResponse.json({
      success: true,
      data: { ...validated, number, id: `inv_${Date.now()}` },
      message: 'Invoice created successfully',
    }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}