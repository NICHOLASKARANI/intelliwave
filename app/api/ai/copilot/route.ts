import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { message } = body

    if (!message || !message.trim()) {
      return NextResponse.json(
        { success: false, response: 'Please provide a message or question.' },
        { status: 400 }
      )
    }

    // Try providers in order: OpenAI → DeepSeek → Claude → Local Fallback
    const providers = [
      { name: 'openai', key: process.env.OPENAI_API_KEY, url: 'https://api.openai.com/v1/chat/completions', model: 'gpt-3.5-turbo' },
      { name: 'deepseek', key: process.env.DEEPSEEK_API_KEY, url: 'https://api.deepseek.com/v1/chat/completions', model: 'deepseek-chat' },
      { name: 'claude', key: process.env.CLAUDE_API_KEY, url: 'https://api.anthropic.com/v1/messages', model: 'claude-3-haiku-20240307' },
    ]

    for (const provider of providers) {
      if (provider.key) {
        try {
          const response = await callProvider(provider, message)
          if (response) {
            return NextResponse.json({
              success: true,
              response,
              model: provider.model,
              provider: provider.name,
            })
          }
        } catch (e) {
          console.log(`${provider.name} failed, trying next...`)
        }
      }
    }

    // Fallback
    return NextResponse.json({
      success: true,
      response: generateLocalResponse(message),
      model: 'intelliwave-local',
      provider: 'local',
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, response: 'Error processing request. Contact support.' },
      { status: 500 }
    )
  }
}

async function callProvider(provider: any, message: string) {
  if (provider.name === 'claude') {
    const res = await fetch(provider.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': provider.key,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: provider.model,
        max_tokens: 500,
        messages: [{ role: 'user', content: message }],
      }),
    })
    const data = await res.json()
    return data.content?.[0]?.text || null
  }

  // OpenAI & DeepSeek (same API format)
  const res = await fetch(provider.url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${provider.key}`,
    },
    body: JSON.stringify({
      model: provider.model,
      messages: [
        { role: 'system', content: 'You are IntelliWave AI Copilot, an enterprise AI assistant for a global technology company based in Nairobi, Kenya.' },
        { role: 'user', content: message },
      ],
      max_tokens: 500,
      temperature: 0.7,
    }),
  })
  const data = await res.json()
  return data.choices?.[0]?.message?.content || null
}

function generateLocalResponse(message: string): string {
  const msg = message.toLowerCase()
  if (msg.includes('price') || msg.includes('cost')) {
    return 'Our pricing starts from KSh 100,000. Visit /pricing for details. Pay via M-Pesa Till 4760783.'
  }
  if (msg.includes('contact') || msg.includes('email')) {
    return 'Contact us: intelliwavehr@gmail.com | WhatsApp: +254 714 694 493'
  }
  return 'I can help with AI engineering, software development, cybersecurity, cloud solutions, and more. What do you need?'
}