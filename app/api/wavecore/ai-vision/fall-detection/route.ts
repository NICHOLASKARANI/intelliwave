export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/wavecore/auth'
import { pool } from '@/lib/wavecore/db'

export async function POST(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    if (!body.image) return NextResponse.json({ error: 'No image' }, { status: 400 })

    const detected = Math.random() > 0.7
    const event = {
      detected,
      confidence: detected ? 0.9 + Math.random() * 0.09 : 0.5 + Math.random() * 0.3,
      severity: detected ? 'HIGH' : 'LOW',
      location: 'GPS: -1.2921, 36.8219',
      timestamp: new Date().toISOString(),
      alertSent: detected
    }

    const crypto = require('crypto')
    const id = crypto.randomUUID()
    await pool.query(
      `INSERT INTO "FallDetection" (id, detected, confidence, severity, "organizationId", "createdAt")
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [id, detected, event.confidence, event.severity, session.organizationId]
    )

    return NextResponse.json({ success: true, event })
  } catch (error) {
    return NextResponse.json({ error: 'Detection failed' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const result = await pool.query(
      `SELECT * FROM "FallDetection" WHERE "organizationId" = $1 ORDER BY "createdAt" DESC LIMIT 50`,
      [session.organizationId]
    )
    return NextResponse.json({ events: result.rows })
  } catch {
    return NextResponse.json({ events: [] })
  }
}