export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    return NextResponse.json({
      success: true,
      message: 'AI Chat is ready. Send a POST request with your message.',
    })
  } catch (error) {
    return NextResponse.json({ success: true, message: 'AI Chat ready.' })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const message = body.message || ''

    // Try AI API
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
        console.error('AI error:', aiError)
      }
    }

    return NextResponse.json({
      reply: 'I can help with your WaveCore ERP. Ask about Finance, CRM, Inventory, HR, Projects, or any module. Organization: ' + session.orgName,
    })
  } catch (error) {
    return NextResponse.json({ reply: 'How can I help you with your ERP today?' })
  }
}