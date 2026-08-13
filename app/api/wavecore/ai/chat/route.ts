export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

export async function POST(request: NextRequest) {
  try {
    const session = await requireTenant()
    const orgId = session.organizationId

    const body = await request.json()
    const { message } = body

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    // Tenant-aware AI: Fetch real org data for context
    const customerCount = await pool.query(
      'SELECT COUNT(*) FROM "Customer" WHERE "organizationId" = $1', [orgId]
    )
    const productCount = await pool.query(
      'SELECT COUNT(*) FROM "Product" WHERE "organizationId" = $1', [orgId]
    )
    const invoiceCount = await pool.query(
      'SELECT COUNT(*) FROM "CustomerInvoice" WHERE "organizationId" = $1', [orgId]
    )

    const context = {
      customers: parseInt(customerCount.rows[0].count),
      products: parseInt(productCount.rows[0].count),
      invoices: parseInt(invoiceCount.rows[0].count),
      organizationName: session.orgName,
    }

    // AI response would use this context
    const lowerMessage = message.toLowerCase()
    let response = ''

    if (lowerMessage.includes('customer') || lowerMessage.includes('client')) {
      response = `Your organization (${context.organizationName}) has ${context.customers} customers. You can view them in the CRM module.`
    } else if (lowerMessage.includes('product') || lowerMessage.includes('inventory')) {
      response = `You have ${context.products} products in inventory. Manage them in the Inventory module.`
    } else if (lowerMessage.includes('invoice') || lowerMessage.includes('revenue')) {
      response = `You have ${context.invoices} invoices. View your financials in the Finance module.`
    } else {
      response = `I'm your WaveCore AI assistant for ${context.organizationName}. You have ${context.customers} customers, ${context.products} products, and ${context.invoices} invoices. How can I help you?`
    }

    return NextResponse.json({
      role: 'assistant',
      content: response,
    })
  } catch (error) {
    console.error('AI chat error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}