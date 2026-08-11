export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const period = searchParams.get('period') || 'month'
    const type = searchParams.get('type') || 'overview'

    // Get counts from all modules
    const [
      customerCount,
      leadCount,
      opportunityCount,
      projectCount,
      invoiceCount,
      productCount,
      employeeCount,
      ticketCount,
    ] = await Promise.all([
      prisma.customer.count(),
      prisma.lead.count(),
      prisma.opportunity.count(),
      prisma.project.count(),
      prisma.customerInvoice.count(),
      prisma.product.count(),
      prisma.employee.count(),
      prisma.supportTicket.count(),
    ])

    const dashboard = {
      overview: {
        customers: customerCount,
        leads: leadCount,
        opportunities: opportunityCount,
        projects: projectCount,
        invoices: invoiceCount,
        products: productCount,
        employees: employeeCount,
        tickets: ticketCount,
      },
      revenue: {
        total: 0,
        trend: 'neutral',
        percentageChange: 0,
      },
      expenses: {
        total: 0,
        trend: 'neutral',
        percentageChange: 0,
      },
      profit: {
        total: 0,
        margin: 0,
      },
    }

    return NextResponse.json(dashboard)
  } catch (error) {
    console.error('Error fetching analytics:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}