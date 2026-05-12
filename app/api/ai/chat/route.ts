import { NextRequest, NextResponse } from 'next/server'

const responses: Record<string, string> = {
  pricing: `Our pricing is transparent and competitive:
• Premium Business Websites: KSh 150,000 - 300,000+
• Advanced E-commerce: KSh 100,000 - 500,000+
• Custom Web Applications: KSh 300,000 - 3,000,000+

All projects include free support (3-12 months) and enterprise-grade security.`,
  
  services: `We offer comprehensive AI and software services:
1. AI Development & Machine Learning
2. Custom Website Development
3. Enterprise SaaS Platforms
4. Cloud Infrastructure (AWS, Azure, GCP)
5. Mobile App Development
6. E-commerce Solutions
7. ERP Systems
8. Cybersecurity
9. HR & Recruitment Services`,
  
  contact: `You can reach us through:
• WhatsApp: +254 714 694 493
• Email: intelliwavehr@gmail.com
• Office: Nairobi CBD, Superior Centre, Shop F11, 1st Floor, Kenyatta Avenue
• Website: https://intelliwave.com/contact`,
  
  team: `Our team consists of 500+ AI engineers and software developers working across 100+ countries. Led by CEO PhD, Eng. Nicholas Karani, we deliver enterprise-grade solutions to clients worldwide.`,
  
  default: `Thank you for your interest in Intelliwave! I can help you with:
• Our services and pricing
• Technical consultations
• Project estimates
• Booking meetings with our team

What would you like to know more about?`,
}

function generateResponse(message: string): string {
  const lower = message.toLowerCase()
  
  if (lower.includes('price') || lower.includes('cost') || lower.includes('how much')) {
    return responses.pricing
  }
  if (lower.includes('service') || lower.includes('offer') || lower.includes('provide')) {
    return responses.services
  }
  if (lower.includes('contact') || lower.includes('reach') || lower.includes('phone') || lower.includes('email')) {
    return responses.contact
  }
  if (lower.includes('team') || lower.includes('who') || lower.includes('engineer') || lower.includes('staff')) {
    return responses.team
  }
  
  return responses.default
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { message } = body

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 1000))

    const response = generateResponse(message)

    return NextResponse.json({
      success: true,
      data: {
        message: response,
        timestamp: new Date().toISOString(),
        model: 'intelliwave-ai-v1',
      },
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    )
  }
}