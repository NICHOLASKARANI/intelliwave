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

    const apiKey = process.env.OPENAI_API_KEY

    // If API key exists, use real OpenAI
    if (apiKey && apiKey.startsWith('sk-')) {
      try {
        const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: [
              {
                role: 'system',
                content: `You are IntelliWave AI Copilot, an enterprise AI assistant for a global technology company based in Nairobi, Kenya. 
                
                About IntelliWave:
                - Founded by PhD, Eng. Nicholas Karani (CEO & Founder)
                - COO: Gefferson Mbeere (CPA, BCOM)
                - CFO: Kelvin Muchui (CPA, BCOM)
                - CTO: Mark Mwangi (AI/Software Engineer)
                - 500+ AI engineers across 100+ countries
                - SOC 2 Type II certified, ISO 27001, GDPR compliant
                - Services: AI Engineering, Software Development, Cybersecurity, Cloud & DevOps, Enterprise Solutions, IIoT Automation
                - HR Services: Corporate Training, Executive Search, Recruitment, Payroll, Employer of Record, Staff Outsourcing
                - Contact: intelliwavehr@gmail.com, WhatsApp: +254 714 694 493
                - Website: intelliwave-psi.vercel.app
                
                You help with:
                - Code generation (React, Next.js, TypeScript, Python, Node.js)
                - Debugging and error resolution
                - Architecture design and system planning
                - Technical consulting and best practices
                - IntelliWave product and service information
                - Project estimation and scoping
                
                Be professional, helpful, and concise. If asked about pricing, mention the contact page or suggest booking a consultation.`,
              },
              { role: 'user', content: message.trim() },
            ],
            max_tokens: 800,
            temperature: 0.7,
          }),
        })

        if (!openaiResponse.ok) {
          throw new Error(`OpenAI API error: ${openaiResponse.status}`)
        }

        const data = await openaiResponse.json()

        if (data.choices?.[0]?.message?.content) {
          return NextResponse.json({
            success: true,
            response: data.choices[0].message.content,
            model: 'gpt-3.5-turbo',
          })
        } else {
          throw new Error('No response content from OpenAI')
        }
      } catch (openaiError) {
        console.error('OpenAI error:', openaiError)
        // Fall back to local response
      }
    }

    // Local fallback response (works without API key)
    const fallbackResponse = generateLocalResponse(message)
    return NextResponse.json({
      success: true,
      response: fallbackResponse,
      model: 'intelliwave-local',
    })
  } catch (error) {
    console.error('Copilot error:', error)
    return NextResponse.json(
      { success: false, response: 'I encountered an error. Please try again or contact support at intelliwavehr@gmail.com.' },
      { status: 500 }
    )
  }
}

function generateLocalResponse(message: string): string {
  const msg = message.toLowerCase()

  if (msg.includes('price') || msg.includes('cost') || msg.includes('how much')) {
    return `IntelliWave offers competitive enterprise pricing:

**Premium Business Websites:** KSh 150,000 - 300,000+
**Advanced E-commerce:** KSh 100,000 - 500,000+
**Custom Web Applications:** KSh 300,000 - 3,000,000+

All projects include enterprise security, free support, and SOC 2 compliance. Visit our pricing page or book a consultation for a custom quote.`
  }

  if (msg.includes('service') || msg.includes('offer') || msg.includes('provide')) {
    return `IntelliWave provides comprehensive enterprise AI and software services:

1. **AI Engineering** - Custom ML models, NLP, computer vision
2. **Software Development** - Web apps, mobile apps, SaaS platforms
3. **Cybersecurity** - SOC operations, threat monitoring, compliance
4. **Cloud & DevOps** - AWS, Azure, GCP, Docker, Kubernetes
5. **Enterprise Solutions** - Digital transformation, ERP systems
6. **IIoT Automation** - Predictive maintenance, real-time monitoring

Plus HR services: Recruitment, Payroll, Training, Staff Outsourcing.`
  }

  if (msg.includes('contact') || msg.includes('email') || msg.includes('phone') || msg.includes('whatsapp')) {
    return `Contact IntelliWave:

📧 Email: karaninicholas700@gmail.com
📱 WhatsApp: +254 714 694 493
🏢 Office: Nairobi CBD, Superior Centre, Shop F11, 1st Floor, Kenyatta Avenue, Kenya
🌐 Website: intelliwave-psi.vercel.app

Business Hours: Mon-Fri 8AM-6PM, Sat 9AM-1PM (EAT)`
  }

  if (msg.includes('leadership') || msg.includes('ceo') || msg.includes('team') || msg.includes('founder')) {
    return `IntelliWave Leadership Team:

**CEO & Founder:** PhD, Eng. Nicholas Karani - Visionary software engineer leading Africa's AI revolution.

**COO:** Gefferson Mbeere (CPA, BCOM) - Operations strategist ensuring global delivery excellence.

**CFO:** Kelvin Muchui (CPA, BCOM) - Financial strategist driving sustainable growth.

**CTO:** Mark Mwangi (AI/Software Engineer) - Technical architect building world-class AI systems.

Together, they lead 500+ engineers across 100+ countries.`
  }

  if (msg.includes('code') || msg.includes('function') || msg.includes('component') || msg.includes('react') || msg.includes('next')) {
    return `Here's a production-ready React component:

\`\`\`tsx
import React from 'react'

interface CardProps {
  title: string
  description: string
  onAction?: () => void
}

export function Card({ title, description, onAction }: CardProps) {
  return (
    <div className="p-6 rounded-xl border bg-white dark:bg-neutral-900 shadow-sm hover:shadow-md transition-shadow">
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="text-neutral-600 dark:text-neutral-400 mb-4">{description}</p>
      {onAction && (
        <button 
          onClick={onAction}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Learn More
        </button>
      )}
    </div>
  )
}
\`\`\`

This uses TypeScript, Tailwind CSS, and follows enterprise best practices.`
  }

  return `I'm IntelliWave AI Copilot. I can help you with:

• **Company Info** - Leadership, services, pricing, contact details
• **Code Generation** - React, Next.js, TypeScript components
• **Architecture** - System design and technology recommendations
• **Services** - AI engineering, development, cybersecurity, cloud
• **Support** - Contact information and consultation booking

What would you like to know?`
}