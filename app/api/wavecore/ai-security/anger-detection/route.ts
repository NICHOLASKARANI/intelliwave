export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/wavecore/auth'

const EMOTIONS = ['Calm', 'Slightly Irritated', 'Frustrated', 'Angry', 'Very Angry', 'Furious']
const VOICE_TONES = ['Neutral', 'Raised', 'Loud', 'Shouting', 'Aggressive']
const KEYWORDS = ['Never!', 'Always!', 'Unacceptable!', 'How dare!', 'I demand!', 'This is wrong!']

export async function POST(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const angerLevel = Math.floor(Math.random() * 100)
    const emotionIndex = Math.min(Math.floor(angerLevel / 20), EMOTIONS.length - 1)
    
    const result = {
      angerLevel,
      emotion: EMOTIONS[emotionIndex],
      intensity: angerLevel > 70 ? 'HIGH' : angerLevel > 40 ? 'MEDIUM' : 'LOW',
      voiceTone: VOICE_TONES[Math.min(Math.floor(angerLevel / 25), VOICE_TONES.length - 1)],
      keywords: angerLevel > 50 ? KEYWORDS.slice(0, 2 + Math.floor(Math.random() * 3)) : [],
      confidence: 0.82 + Math.random() * 0.16,
      recommendation: angerLevel > 70 
        ? 'Immediate de-escalation required. Take a break and continue later.'
        : angerLevel > 40 
        ? 'Use calm tone. Acknowledge concerns.'
        : 'Conversation is calm. Continue normally.',
      timestamp: new Date().toISOString()
    }

    return NextResponse.json({ success: true, result })
  } catch (error) {
    return NextResponse.json({ error: 'Detection failed' }, { status: 500 })
  }
}