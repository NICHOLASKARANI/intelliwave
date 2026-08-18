export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

// GET: Return ERP stats and insights
export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session || !session.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const orgId = session.organizationId

    const [customers, leads, products, invoices, employees, projects] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM "Customer" WHERE "organizationId" = $1', [orgId]),
      pool.query('SELECT COUNT(*) FROM "Lead" WHERE "organizationId" = $1', [orgId]),
      pool.query('SELECT COUNT(*) FROM "Product" WHERE "organizationId" = $1', [orgId]),
      pool.query('SELECT COUNT(*) FROM "CustomerInvoice" WHERE "organizationId" = $1', [orgId]),
      pool.query('SELECT COUNT(*) FROM "Employee" WHERE "organizationId" = $1', [orgId]),
      pool.query('SELECT COUNT(*) FROM "Project"', []),
    ])

    const insights: string[] = []
    if (parseInt(customers.rows[0].count) === 0) insights.push('No customers yet. Add your first customer in CRM.')
    if (parseInt(products.rows[0].count) === 0) insights.push('No products in inventory. Add products to track stock.')
    if (parseInt(invoices.rows[0].count) === 0) insights.push('No invoices created. Start billing customers.')
    if (parseInt(employees.rows[0].count) === 0) insights.push('No employees registered. Set up HR module.')
    if (insights.length === 0) insights.push('All modules have data. Your ERP is well set up!')

    return NextResponse.json({
      success: true,
      data: {
        crm: {
          customers: parseInt(customers.rows[0].count),
          leads: parseInt(leads.rows[0].count),
        },
        inventory: { products: parseInt(products.rows[0].count) },
        finance: { invoices: parseInt(invoices.rows[0].count) },
        hr: { employees: parseInt(employees.rows[0].count) },
        projects: { total: parseInt(projects.rows[0].count) },
      },
      insights,
    })
  } catch (error) {
    console.error('AI copilot GET error:', error)
    return NextResponse.json({ success: true, data: {}, insights: ['Add data to see AI insights.'] })
  }
}

// POST: Chat with AI Copilot
export async function POST(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const message = body.message || ''

    // Try DeepSeek API if key exists
    const apiKey = process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY || process.env.CLAUDE_API_KEY
    
    if (apiKey) {
      try {
        const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + apiKey,
          },
          body: JSON.stringify({
            model: 'deepseek-chat',
            messages: [{ role: 'user', content: message }],
            max_tokens: 500,
          }),
        })
        
        if (response.ok) {
          const data = await response.json()
          return NextResponse.json({ reply: data.choices[0].message.content })
        }
      } catch (aiError) {
        console.error('AI API error:', aiError)
      }
    }

    // Fallback response
    const reply = generateLocalResponse(message, session)
    return NextResponse.json({ reply })
    
  } catch (error) {
    return NextResponse.json({ reply: 'I can help you with your WaveCore ERP. Ask me about finance, CRM, inventory, HR, or any module.' })
  }
}

function generateLocalResponse(message: string, session: any): string {
  const lower = message.toLowerCase()
  
  if (lower.includes('revenue') || lower.includes('finance')) {
    return 'Finance Module: View Chart of Accounts, Journal Entries, Invoices, Payments, and Bank Reconciliation. Your organization is ' + session.orgName + '.'
  }
  if (lower.includes('customer') || lower.includes('crm')) {
    return 'CRM Module: Manage Customers, Leads, Opportunities, Quotations, and Orders. All CRM data is tenant-isolated.'
  }
  if (lower.includes('inventory') || lower.includes('product') || lower.includes('stock')) {
    return 'Inventory Module: Track Products, Warehouses, Stock Movements, and Transfers. Use the Inventory dashboard for real-time stock levels.'
  }
  if (lower.includes('employee') || lower.includes('hr') || lower.includes('payroll')) {
    return 'HR Module: Manage Employees, Attendance, Leave, and Payroll. Employee records are tenant-isolated.'
  }
  if (lower.includes('project')) {
    return 'Projects Module: Create Projects, Tasks, Milestones, and track Budgets. Project status is ACTIVE by default.'
  }
  if (lower.includes('help') || lower.includes('what can you do')) {
    return 'I can help with:\n\nFinance - Invoices, Payments, Reports\nCRM - Customers, Leads, Sales\nInventory - Products, Stock\nHR - Employees, Payroll\nProjects - Tasks, Budgets\n\nAsk me anything about your ERP!'
  }
  
  return 'I am your WaveCore AI Copilot. You asked: "' + message + '". I can help with Finance, CRM, Inventory, HR, Projects, Helpdesk, and more.'
}