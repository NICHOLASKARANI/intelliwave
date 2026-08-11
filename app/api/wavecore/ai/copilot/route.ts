import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const query = searchParams.get('query') || 'overview'
    const module = searchParams.get('module') || 'all'

    const data: any = {
      timestamp: new Date().toISOString(),
      query,
      module,
    }

    // Fetch data based on query
    if (module === 'all' || module === 'crm') {
      data.crm = {
        customers: await prisma.customer.count(),
        leads: await prisma.lead.count(),
        opportunities: await prisma.opportunity.count(),
      }
    }

    if (module === 'all' || module === 'finance') {
      data.finance = {
        invoices: await prisma.customerInvoice.count(),
        payments: await prisma.customerPayment.count(),
        journalEntries: await prisma.journalEntry.count(),
      }
    }

    if (module === 'all' || module === 'inventory') {
      data.inventory = {
        products: await prisma.product.count(),
        warehouses: await prisma.warehouse.count(),
      }
    }

    if (module === 'all' || module === 'hr') {
      data.hr = {
        employees: await prisma.employee.count(),
      }
    }

    if (module === 'all' || module === 'projects') {
      data.projects = {
        total: await prisma.project.count(),
      }
    }

    return NextResponse.json({
      success: true,
      insights: generateInsights(data),
      data,
    })
  } catch (error) {
    console.error('Error in AI copilot:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function generateInsights(data: any): string[] {
  const insights: string[] = []

  if (data.crm) {
    if (data.crm.customers === 0) insights.push('No customers yet. Start by adding your first customer in the CRM module.')
    if (data.crm.leads === 0) insights.push('No leads captured. Create a lead capture form to start building your pipeline.')
  }

  if (data.finance) {
    if (data.finance.invoices === 0) insights.push('No invoices created. Set up your first invoice in the Finance module.')
  }

  if (data.inventory) {
    if (data.inventory.products === 0) insights.push('No products in inventory. Add products to start tracking stock levels.')
  }

  if (data.hr) {
    if (data.hr.employees === 0) insights.push('No employees registered. Add employees in the HR module.')
  }

  if (insights.length === 0) {
    insights.push('All modules have data. Your ERP is well set up!')
  }

  return insights
}