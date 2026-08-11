import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { message, context } = body

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    // AI response logic would go here
    // For now, return a helpful response
    const response = {
      id: Date.now().toString(),
      role: 'assistant',
      content: generateAIResponse(message),
      timestamp: new Date().toISOString(),
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error in AI chat:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function generateAIResponse(message: string): string {
  const lowerMessage = message.toLowerCase()

  if (lowerMessage.includes('revenue') || lowerMessage.includes('sales')) {
    return "Based on your current data, here's a revenue summary:\n\n📊 **Revenue Overview**\n- Total Revenue (MTD): KSh 0.00\n- Compared to last month: No data yet\n- Top revenue source: No data yet\n\n💡 **Insight**: Start recording sales transactions to get detailed revenue analytics."
  }

  if (lowerMessage.includes('inventory') || lowerMessage.includes('stock')) {
    return "Here's your current inventory status:\n\n📦 **Inventory Overview**\n- Total Products: 0\n- Low Stock Items: 0\n- Inventory Value: KSh 0.00\n\n💡 **Recommendation**: Add products and stock levels to get inventory insights."
  }

  if (lowerMessage.includes('customer') || lowerMessage.includes('client')) {
    return "Here's your customer overview:\n\n👥 **Customer Analytics**\n- Total Customers: 0\n- Active Customers: 0\n- New This Month: 0\n\n💡 **Tip**: Add customers to start tracking relationships and sales."
  }

  if (lowerMessage.includes('employee') || lowerMessage.includes('staff') || lowerMessage.includes('hr')) {
    return "Here's your HR overview:\n\n👔 **Workforce Analytics**\n- Total Employees: 0\n- Attendance Rate: N/A\n- Open Positions: 0\n\n💡 **Suggestion**: Add employees to begin workforce management."
  }

  if (lowerMessage.includes('forecast') || lowerMessage.includes('predict')) {
    return "📈 **AI Forecast**\n\nTo generate accurate forecasts, I need historical data. Currently, your database is being set up.\n\nOnce data is available, I can predict:\n- Revenue trends\n- Inventory needs\n- Cash flow projections\n- Customer demand patterns\n\nStart entering data to enable AI forecasting!"
  }

  if (lowerMessage.includes('report') || lowerMessage.includes('generate')) {
    return "📝 **Report Generation**\n\nI can generate various reports once data is available:\n\n1. **Financial Reports** - Income Statement, Balance Sheet\n2. **Sales Reports** - Pipeline, Revenue Analysis\n3. **Inventory Reports** - Stock Levels, Valuation\n4. **HR Reports** - Attendance, Payroll Summary\n5. **Manufacturing Reports** - Production Output, Quality\n\nWhich type of report would you like?"
  }

  return "I understand you're asking about: \"" + message + "\"\n\nAs your AI Copilot, I'm here to help with:\n\n📊 **Data Analysis** - Analyze any business data\n📈 **Forecasting** - Predict trends and outcomes\n🔍 **Smart Search** - Find anything across your ERP\n📝 **Report Generation** - Create instant reports\n💡 **Recommendations** - Get AI-powered suggestions\n\nTry asking about revenue, inventory, customers, employees, or ask me to generate a report!"
}