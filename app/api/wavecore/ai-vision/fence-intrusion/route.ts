export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/wavecore/auth'
import { pool } from '@/lib/wavecore/db'

export async function POST(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const breachDetected = Math.random() > 0.8
    const sections = ['North Perimeter', 'South Perimeter', 'East Perimeter', 'West Perimeter']
    const breachTypes = ['Climbing', 'Cutting', 'Digging', 'Vehicle Impact', 'Tampering']

    const event = {
      breachDetected,
      fenceSection: sections[Math.floor(Math.random() * sections.length)],
      breachType: breachDetected ? breachTypes[Math.floor(Math.random() * breachTypes.length)] : 'None',
      confidence: breachDetected ? 0.9 + Math.random() * 0.09 : 0.88 + Math.random() * 0.08,
      timestamp: new Date().toISOString(),
      perimeterStatus: breachDetected ? 'BREACHED' : 'SECURE',
      responseTime: breachDetected ? Math.floor(2 + Math.random() * 8) : 0
    }

    return NextResponse.json({ success: true, event })
  } catch (error) {
    return NextResponse.json({ error: 'Detection failed' }, { status: 500 })
  }
}