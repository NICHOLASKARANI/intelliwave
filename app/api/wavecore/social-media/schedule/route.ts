export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/wavecore/auth'

const OPTIMAL_TIMES = ['06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00']

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const schedule = OPTIMAL_TIMES.map((time, i) => ({
      time,
      platform: ['instagram', 'facebook', 'whatsapp', 'tiktok', 'twitter'][i % 5],
      contentType: ['image', 'video', 'story', 'reel', 'post'][i % 5],
      status: 'SCHEDULED'
    }))

    return NextResponse.json({ success: true, schedule })
  } catch (error) {
    return NextResponse.json({ schedule: [] })
  }
}