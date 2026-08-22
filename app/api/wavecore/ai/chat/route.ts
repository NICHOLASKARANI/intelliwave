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

    // Get real ERP data for context
    const [customers, products, employees, invoices] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM "Customer" WHERE "organizationId" = $1', [session.organizationId]),
      pool.query('SELECT COUNT(*) FROM "Product" WHERE "organizationId" = $1', [session.organizationId]),
      pool.query('SELECT COUNT(*) FROM "Employee" WHERE "organizationId" = $1', [session.organizationId]),
      pool.query('SELECT COUNT(*) FROM "CustomerInvoice" WHERE "organizationId" = $1', [session.organizationId]),
    ])

    const erpContext = `
    You are WaveCore AI Copilot for ${session.orgName}.
    Real-time data:
    - Customers: ${customers.rows[0].count}
    - Products: ${products.rows[0].count}
    - Employees: ${employees.rows[0].count}
    - Invoices: ${invoices.rows[0].count}
    
    User question: ${message}
    
    Answer based on this real data. Be concise and helpful.`

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

    if (!apiKey) {
      return NextResponse.json({ reply: 'AI service not configured. Please add API keys in Vercel environment variables.' })
    }

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
            ? { model, max_tokens: 500, messages: [{ role: 'user', content: erpContext }] }
            : { model, max_tokens: 500, messages: [{ role: 'user', content: erpContext }] }
        ),
      })

      const data = await response.json()

      let reply = ''
      if (provider === 'CLAUDE') {
        reply = data.content?.[0]?.text || 'No response from Claude.'
      } else {
        reply = data.choices?.[0]?.message?.content || 'No response from AI.'
      }

      return NextResponse.json({ reply })
    } catch (aiError) {
      return NextResponse.json({ reply: 'AI service error. Your real ERP data: Customers: ' + customers.rows[0].count + ', Products: ' + products.rows[0].count + ', Employees: ' + employees.rows[0].count + ', Invoices: ' + invoices.rows[0].count })
    }
  } catch (error) {
    return NextResponse.json({ error: 'Failed: ' + (error as Error).message }, { status: 500 })
  }
}