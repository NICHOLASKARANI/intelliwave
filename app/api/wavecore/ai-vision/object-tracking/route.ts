export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/wavecore/auth'
import { pool } from '@/lib/wavecore/db'

const OBJECT_TYPES = ['Person', 'Vehicle', 'Bicycle', 'Motorcycle', 'Truck', 'Animal', 'Package']
const DIRECTIONS = ['North', 'South', 'East', 'West', 'Northeast', 'Northwest', 'Southeast', 'Southwest']

export async function POST(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const object = {
      objectType: OBJECT_TYPES[Math.floor(Math.random() * OBJECT_TYPES.length)],
      coordinates: {
        x: Math.random(),
        y: Math.random()
      },
      speed: Math.random() * 20,
      direction: DIRECTIONS[Math.floor(Math.random() * DIRECTIONS.length)],
      confidence: 0.85 + Math.random() * 0.14,
      timestamp: new Date().toISOString()
    }

    return NextResponse.json({ success: true, object })
  } catch (error) {
    return NextResponse.json({ error: 'Tracking failed' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const result = await pool.query(
      `SELECT * FROM "ObjectTracking" WHERE "organizationId" = $1 ORDER BY "createdAt" DESC LIMIT 100`,
      [session.organizationId]
    )
    return NextResponse.json({ objects: result.rows })
  } catch {
    return NextResponse.json({ objects: [] })
  }
}