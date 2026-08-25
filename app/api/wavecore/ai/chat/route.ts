export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/wavecore/auth'
import { pool } from '@/lib/wavecore/db'

export async function POST(req: NextRequest) {
  try {
    const session = await requireTenant(req)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { message, provider } = body

    // Get REAL ERP data
    const [customers, products, employees, invoices, revenue] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM "Customer" WHERE "organizationId" = $1', [session!.organizationId]),
      pool.query('SELECT COUNT(*) FROM "Product" WHERE "organizationId" = $1', [session!.organizationId]),
      pool.query('SELECT COUNT(*) FROM "Employee" WHERE "organizationId" = $1', [session!.organizationId]),
      pool.query('SELECT COUNT(*) FROM "CustomerInvoice" WHERE "organizationId" = $1', [session!.organizationId]),
      pool.query('SELECT COALESCE(SUM(subtotal + "taxAmount"), 0) as total FROM "CustomerInvoice" WHERE "organizationId" = $1', [session!.organizationId]),
    ])

    const realData = {
      customers: customers.rows[0].count,
      products: products.rows[0].count,
      employees: employees.rows[0].count,
      invoices: invoices.rows[0].count,
      revenue: revenue.rows[0].total,
      orgName: session.orgName,
    }

    // Try AI API
    let aiReply = ''
    let apiKey = ''
    let apiUrl = ''
    let model = ''

    if (provider === 'DEEPSEEK') {
      apiKey = process.env.DEEPSEEK_API_KEY || ''
      apiUrl = 'https://api.deepseek.com/v1/chat/completions'
      model = 'deepseek-chat'
    } else if (provider === 'CLAUDE') {
      apiKey = process.env.CLAUDE_API_KEY || ''
      apiUrl = 'https://api.anthropic.com/v1/messages'
      model = 'claude-3-5-sonnet-20241022'
    } else {
      apiKey = process.env.OPENAI_API_KEY || ''
      apiUrl = 'https://api.openai.com/v1/chat/completions'
      model = 'gpt-4o-mini'
    }

    const prompt = `You are WaveCore AI Copilot for ${realData.orgName}. Real data: ${realData.customers} customers, ${realData.products} products, ${realData.employees} employees, ${realData.invoices} invoices, Revenue: KSh ${realData.revenue}. Answer: ${message}`

    if (apiKey) {
      try {
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(provider === 'CLAUDE' 
              ? { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' }
              : { 'Authorization': 'Bearer ' + apiKey }),
          },
          body: JSON.stringify(
            provider === 'CLAUDE'
              ? { model, max_tokens: 500, messages: [{ role: 'user', content: prompt }] }
              : { model, max_tokens: 500, messages: [{ role: 'user', content: prompt }] }
          ),
        })

        const data = await response.json()

        if (provider === 'CLAUDE') {
          aiReply = data.content?.[0]?.text || ''
        } else {
          aiReply = data.choices?.[0]?.message?.content || ''
        }
      } catch (aiError) {
        aiReply = ''
      }
    }

    // FALLBACK: If AI fails, respond with REAL data
    if (!aiReply) {
      aiReply = `Here is your real-time ERP data for ${realData.orgName}:\n\n• Customers: ${realData.customers}\n• Products: ${realData.products}\n• Employees: ${realData.employees}\n• Invoices: ${realData.invoices}\n• Revenue: KSh ${realData.revenue.toLocaleString()}\n\n${provider} is not responding. Try another provider or check API keys.`
    }

    return NextResponse.json({ reply: aiReply })
  } catch (error) {
    return NextResponse.json({ error: 'Failed: ' + (error as Error).message }, { status: 500 })
  }
}