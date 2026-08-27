export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/wavecore/auth'
import { pool } from '@/lib/wavecore/db'

const PREDATORS = ['Coyote', 'Wolf', 'Bear', 'Mountain Lion', 'Fox', 'Wild Dog', 'Hyena', 'Leopard']
const ZONES = ['North Pasture', 'South Pasture', 'East Corral', 'West Field', 'Watering Hole']

export async function POST(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const detected = Math.random() > 0.75
    const event = {
      predatorDetected: detected,
      animalType: detected ? PREDATORS[Math.floor(Math.random() * PREDATORS.length)] : 'None',
      threatLevel: detected ? (Math.random() > 0.5 ? 'HIGH' : 'MEDIUM') : 'LOW',
      distance: detected ? Math.floor(10 + Math.random() * 90) : 100,
      livestockAtRisk: detected ? Math.floor(5 + Math.random() * 50) : 0,
      confidence: detected ? 0.9 + Math.random() * 0.09 : 0.85 + Math.random() * 0.1,
      zone: ZONES[Math.floor(Math.random() * ZONES.length)],
      timestamp: new Date().toISOString(),
      deterrentActivated: detected && Math.random() > 0.5
    }

    return NextResponse.json({ success: true, event })
  } catch (error) {
    return NextResponse.json({ error: 'Detection failed' }, { status: 500 })
  }
}