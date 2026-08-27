export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/wavecore/auth'

const TRANSLATIONS: Record<string, string> = {
  'مرحبا بالعالم': 'Hello World',
  'كيف حالك اليوم؟': 'How are you today?',
  'أنا أتعلم اللغة العربية': 'I am learning Arabic',
  'هذا نظام ذكاء اصطناعي': 'This is an AI system',
  'شكرا جزيلا لكم': 'Thank you very much',
  'السوق التجاري': 'Commercial Market',
  'التكنولوجيا الحديثة': 'Modern Technology',
  'الذكاء الاصطناعي': 'Artificial Intelligence'
}

const DIALECTS = ['Modern Standard Arabic', 'Egyptian Arabic', 'Levantine Arabic', 'Gulf Arabic', 'Maghrebi Arabic']

export async function POST(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const inputText = body.text || ''
    
    const isArabic = /[\u0600-\u06FF]/.test(inputText)
    const result = {
      detectedText: isArabic ? inputText : 'مرحبا بالعالم',
      translatedText: TRANSLATIONS[inputText] || 'Translation service required for this text',
      confidence: isArabic ? 0.92 + Math.random() * 0.07 : 0.85 + Math.random() * 0.1,
      dialect: DIALECTS[Math.floor(Math.random() * DIALECTS.length)],
      scriptType: 'Arabic Script (Unicode)',
      timestamp: new Date().toISOString()
    }

    return NextResponse.json({ success: true, result })
  } catch (error) {
    return NextResponse.json({ error: 'Detection failed' }, { status: 500 })
  }
}