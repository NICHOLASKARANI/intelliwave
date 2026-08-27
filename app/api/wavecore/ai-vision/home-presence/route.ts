export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/wavecore/auth'

const ROOMS = ['Living Room', 'Kitchen', 'Bedroom', 'Bathroom', 'Garage', 'Garden']
const ACTIVITIES = ['Walking', 'Sitting', 'Sleeping', 'Cooking', 'Working', 'Watching TV']

export async function POST(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const occupied = Math.random() > 0.3
    const personCount = occupied ? 1 + Math.floor(Math.random() * 4) : 0
    
    const event = {
      occupied,
      personCount,
      room: ROOMS[Math.floor(Math.random() * ROOMS.length)],
      activity: occupied ? ACTIVITIES[Math.floor(Math.random() * ACTIVITIES.length)] : 'None',
      confidence: 0.88 + Math.random() * 0.11,
      timestamp: new Date().toISOString(),
      smartActions: occupied ? ['Lights ON', 'HVAC Adjusted', 'Security Armed'] : ['Lights OFF', 'HVAC Eco Mode', 'Security Monitoring']
    }

    return NextResponse.json({ success: true, event })
  } catch (error) {
    return NextResponse.json({ error: 'Detection failed' }, { status: 500 })
  }
}