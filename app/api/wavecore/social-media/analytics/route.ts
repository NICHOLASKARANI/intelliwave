export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/wavecore/auth'

const OPTIMAL_TIMES = ['06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00']

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const analytics = {
      totalPosts: Math.floor(50 + Math.random() * 200),
      totalEngagement: Math.floor(1000 + Math.random() * 10000),
      followers: Math.floor(500 + Math.random() * 5000),
      platforms: {
        instagram: Math.floor(100 + Math.random() * 2000),
        facebook: Math.floor(100 + Math.random() * 2000),
        whatsapp: Math.floor(50 + Math.random() * 1000),
        tiktok: Math.floor(100 + Math.random() * 3000),
        twitter: Math.floor(50 + Math.random() * 500),
      },
      growth: Math.floor(1 + Math.random() * 20),
      bestTime: OPTIMAL_TIMES[Math.floor(Math.random() * OPTIMAL_TIMES.length)]
    }

    return NextResponse.json({ success: true, analytics })
  } catch (error) {
    return NextResponse.json({ analytics: {} })
  }
}