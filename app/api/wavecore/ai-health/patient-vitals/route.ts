export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/wavecore/auth'
import { pool } from '@/lib/wavecore/db'

export async function POST(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const heartRate = 60 + Math.floor(Math.random() * 50)
    const oxygenSat = 88 + Math.floor(Math.random() * 12)
    const consciousness = ['Alert', 'Verbal', 'Pain', 'Unresponsive'][Math.floor(Math.random() * 4)]
    
    const data = {
      patientId: 'PT-' + String(1000 + Math.floor(Math.random() * 9000)),
      heartRate,
      bloodPressure: `${110 + Math.floor(Math.random() * 40)}/${70 + Math.floor(Math.random() * 30)}`,
      temperature: 36 + Math.random() * 3,
      oxygenSaturation: oxygenSat,
      respiratoryRate: 12 + Math.floor(Math.random() * 15),
      consciousness,
      distressLevel: oxygenSat < 90 || heartRate > 110 ? 'CRITICAL' : heartRate > 90 ? 'WARNING' : 'NORMAL',
      timestamp: new Date().toISOString()
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    return NextResponse.json({ error: 'Monitoring failed' }, { status: 500 })
  }
}