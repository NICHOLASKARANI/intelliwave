export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/wavecore/auth'
import { pool } from '@/lib/wavecore/db'

export async function POST(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const detected = Math.random() > 0.75
    const personCount = detected ? 1 + Math.floor(Math.random() * 3) : 0
    
    const event = {
      detected,
      personCount,
      confidence: detected ? 0.9 + Math.random() * 0.09 : 0.85 + Math.random() * 0.1,
      zone: ['Perimeter', 'Entrance', 'Parking', 'Warehouse', 'Garden'][Math.floor(Math.random() * 5)],
      threatLevel: detected ? (Math.random() > 0.5 ? 'HIGH' : 'MEDIUM') : 'LOW',
      timestamp: new Date().toISOString(),
      alertSent: detected
    }

    return NextResponse.json({ success: true, event })
  } catch (error) {
    return NextResponse.json({ error: 'Detection failed' }, { status: 500 })
  }
}