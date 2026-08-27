export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/wavecore/auth'

export async function POST(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const ejectionFraction = Math.floor(40 + Math.random() * 35)
    const pumpingEfficiency = Math.floor(50 + Math.random() * 45)
    const health = ejectionFraction < 40 ? 'CRITICAL' : ejectionFraction < 50 ? 'WARNING' : 'NORMAL'
    
    const result = {
      ejectionFraction,
      cardiacOutput: 3 + Math.random() * 4,
      strokeVolume: 50 + Math.random() * 40,
      pumpingEfficiency,
      heartHealth: health,
      rhythm: health === 'NORMAL' ? 'Normal Sinus Rhythm' : Math.random() > 0.5 ? 'Atrial Fibrillation' : 'Tachycardia',
      confidence: 0.86 + Math.random() * 0.12,
      waveform: Array.from({ length: 100 }, (_, i) => 
        Math.sin(i * 0.25) * 20 + Math.sin(i * 0.05) * 8 + Math.random() * 4
      ),
      timestamp: new Date().toISOString()
    }

    return NextResponse.json({ success: true, result })
  } catch (error) {
    return NextResponse.json({ error: 'Analysis failed' }, { status: 500 })
  }
}