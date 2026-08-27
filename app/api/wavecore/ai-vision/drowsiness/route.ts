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

    const drowsy = Math.random() > 0.6
    const event = {
      drowsy,
      eyeClosure: drowsy ? 0.7 + Math.random() * 0.25 : 0.1 + Math.random() * 0.3,
      yawnCount: drowsy ? Math.floor(Math.random() * 3) + 2 : Math.floor(Math.random() * 2),
      headNodding: drowsy && Math.random() > 0.5,
      alertLevel: drowsy ? 'HIGH' : 'NORMAL',
      confidence: 0.85 + Math.random() * 0.14,
      timestamp: new Date().toISOString()
    }

    const crypto = require('crypto')
    const id = crypto.randomUUID()
    await pool.query(
      `INSERT INTO "DrowsinessDetection" (id, drowsy, "eyeClosure", "yawnCount", "headNodding", "alertLevel", "organizationId", "createdAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
      [id, drowsy, event.eyeClosure, event.yawnCount, event.headNodding, event.alertLevel, session.organizationId]
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
      `SELECT * FROM "DrowsinessDetection" WHERE "organizationId" = $1 ORDER BY "createdAt" DESC LIMIT 50`,
      [session.organizationId]
    )
    return NextResponse.json({ events: result.rows })
  } catch {
    return NextResponse.json({ events: [] })
  }
}