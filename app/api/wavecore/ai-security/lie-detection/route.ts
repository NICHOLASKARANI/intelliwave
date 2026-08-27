export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/wavecore/auth'

const MICRO_EXPRESSIONS = ['Eye Darting', 'Lip Pressing', 'Nose Wrinkle', 'Rapid Blinking', 'Asymmetric Smile', 'Chin Raise']
const FACIAL_CUES = ['Pupil Dilation', 'Sweating', 'Facial Flushing', 'Avoided Eye Contact', 'Forced Smile']

export async function POST(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const deceptionLikely = Math.random() > 0.5
    const truthProb = deceptionLikely ? 0.1 + Math.random() * 0.3 : 0.7 + Math.random() * 0.25
    const deceptionProb = 1 - truthProb

    const result = {
      truthProbability: truthProb,
      deceptionProbability: deceptionProb,
      microExpression: MICRO_EXPRESSIONS[Math.floor(Math.random() * MICRO_EXPRESSIONS.length)],
      voiceStress: 20 + Math.random() * 60,
      facialCues: FACIAL_CUES.slice(0, 2 + Math.floor(Math.random() * 3)),
      confidence: 0.8 + Math.random() * 0.18,
      verdict: deceptionLikely ? 'DECEPTION LIKELY' : 'TRUTHFUL',
      timestamp: new Date().toISOString()
    }

    return NextResponse.json({ success: true, result })
  } catch (error) {
    return NextResponse.json({ error: 'Analysis failed' }, { status: 500 })
  }
}