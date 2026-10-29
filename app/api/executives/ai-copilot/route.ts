export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const leaderId = req.cookies.get('executive_session')?.value
    if (!leaderId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { target_industry, product } = await req.json()
    
    // In a real production scenario, call OpenAI or DeepSeek here using process.env.DEEPSEEK_API_KEY
    // For now, we use a smart local template so it works immediately without API costs.
    
    const productName = product === 'wavecore' ? 'WaveCore ERP' : 'WavveMarket'
    
    const message = `Hello! I am an IntelliWavve AI Executive Leader. I noticed your business in the ${target_industry} sector. We are helping businesses like yours scale using ${productName}. If you want to manage your finances, inventory, and sales 10x faster, I can set up a free demo for you today. Are you available for a quick chat?`

    return NextResponse.json({ 
      success: true, 
      message,
      whatsapp_link: `https://wa.me/254714694493?text=${encodeURIComponent(message)}` 
    })
  } catch (error) {
    return NextResponse.json({ error: 'AI failed' }, { status: 500 })
  }
}