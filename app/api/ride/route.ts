import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { getSession } from '@/lib/wavecore/auth'

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const result = await pool.query(
      `SELECT * FROM "RideRequest" WHERE "userId" = $1 ORDER BY "createdAt" DESC LIMIT 10`,
      [session.userId]
    )
    return NextResponse.json({ rides: result.rows })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch rides' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const result = await pool.query(
      `INSERT INTO "RideRequest" ("userId", "pickupLat", "pickupLng", "dropoffLat", "dropoffLng", "pickupAddress", "dropoffAddress", "rideType", price)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [session.userId, body.pickupLat, body.pickupLng, body.dropoffLat, body.dropoffLng, body.pickupAddress, body.dropoffAddress, body.rideType, body.price]
    )

    return NextResponse.json({ ride: result.rows[0] }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to request ride' }, { status: 500 })
  }
}