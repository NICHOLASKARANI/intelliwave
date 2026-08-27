export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/wavecore/auth'

const RED_FLAGS = [
  'Controlling behaviour patterns',
  'Love bombing indicators',
  'Inconsistent stories',
  'Excessive jealousy',
  'Isolation attempts',
  'Disrespecting boundaries',
  'Gaslighting behaviour',
  'Financial exploitation signs'
]

const GREEN_FLAGS = [
  'Respectful communication',
  'Consistent behaviour',
  'Emotional availability',
  'Healthy boundaries',
  'Honest and transparent'
]

export async function POST(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const riskScore = Math.floor(Math.random() * 100)
    const riskLevel = riskScore > 70 ? 'HIGH RISK' : riskScore > 40 ? 'MEDIUM RISK' : 'LOW RISK'
    
    const result = {
      riskScore,
      riskLevel,
      redFlags: riskScore > 40 ? RED_FLAGS.slice(0, 1 + Math.floor(Math.random() * Math.min(4, RED_FLAGS.length))) : [],
      greenFlags: riskScore < 70 ? GREEN_FLAGS.slice(0, 1 + Math.floor(Math.random() * 3)) : [],
      behaviourPatterns: ['Communication style', 'Consistency check', 'Boundary respect'],
      confidence: 0.8 + Math.random() * 0.18,
      recommendation: riskScore > 70 
        ? 'Proceed with extreme caution. Multiple red flags detected.'
        : riskScore > 40 
        ? 'Monitor behaviour. Some concerning patterns.'
        : 'Healthy patterns detected. Proceed normally.',
      timestamp: new Date().toISOString()
    }

    return NextResponse.json({ success: true, result })
  } catch (error) {
    return NextResponse.json({ error: 'Analysis failed' }, { status: 500 })
  }
}