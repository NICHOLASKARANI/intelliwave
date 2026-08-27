export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/wavecore/auth'
import { pool } from '@/lib/wavecore/db'

const BEHAVIOURS = ['Grazing', 'Resting', 'Walking', 'Ruminating', 'Drinking', 'Socializing', 'Agitated', 'Estrus Signs']

export async function POST(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const analysis = {
      animalId: 'Cattle-' + String(100 + Math.floor(Math.random() * 900)),
      behaviour: BEHAVIOURS[Math.floor(Math.random() * BEHAVIOURS.length)],
      estrusDetected: Math.random() > 0.8,
      calvingDetected: Math.random() > 0.9,
      dangerDetected: Math.random() > 0.85,
      healthScore: Math.floor(60 + Math.random() * 40),
      temperature: 37.5 + Math.random() * 2.5,
      activityLevel: ['Low', 'Normal', 'High'][Math.floor(Math.random() * 3)],
      confidence: 0.85 + Math.random() * 0.14,
      timestamp: new Date().toISOString()
    }

    return NextResponse.json({ success: true, analysis })
  } catch (error) {
    return NextResponse.json({ error: 'Analysis failed' }, { status: 500 })
  }
}