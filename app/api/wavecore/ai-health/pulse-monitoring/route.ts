export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/wavecore/auth'
import { pool } from '@/lib/wavecore/db'

export async function POST(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const pulseRate = 60 + Math.floor(Math.random() * 40)
    const waveform = Array.from({ length: 100 }, (_, i) => 
      Math.sin(i * 0.3) * 15 + Math.sin(i * 0.05) * 5 + Math.random() * 3
    )
    
    const data = {
      pulseRate,
      personCount: 1 + Math.floor(Math.random() * 3),
      stressLevel: pulseRate > 100 ? 'HIGH' : pulseRate > 80 ? 'MEDIUM' : 'NORMAL',
      confidence: 0.87 + Math.random() * 0.12,
      timestamp: new Date().toISOString(),
      waveform
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    return NextResponse.json({ error: 'Monitoring failed' }, { status: 500 })
  }
}