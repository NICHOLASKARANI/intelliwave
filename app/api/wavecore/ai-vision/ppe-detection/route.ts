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

    // Simulate PPE detection (integrate OpenCV/TensorFlow in production)
    const workerCount = Math.floor(Math.random() * 5) + 1
    const detection = {
      hardHat: Math.random() > 0.2,
      safetyVest: Math.random() > 0.25,
      gloves: Math.random() > 0.3,
      boots: Math.random() > 0.15,
      confidence: 0.85 + Math.random() * 0.14,
      workerCount,
      timestamp: new Date().toISOString()
    }

    const crypto = require('crypto')
    const id = crypto.randomUUID()
    await pool.query(
      `INSERT INTO "PPEDetection" (id, "workerCount", "hardHat", "safetyVest", gloves, boots, confidence, "organizationId", "createdAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
      [id, workerCount, detection.hardHat, detection.safetyVest, detection.gloves, detection.boots, detection.confidence, session.organizationId]
    )

    return NextResponse.json({ success: true, detection })
  } catch (error) {
    return NextResponse.json({ error: 'Detection failed' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const result = await pool.query(
      `SELECT * FROM "PPEDetection" WHERE "organizationId" = $1 ORDER BY "createdAt" DESC LIMIT 50`,
      [session.organizationId]
    )
    return NextResponse.json({ detections: result.rows })
  } catch {
    return NextResponse.json({ detections: [] })
  }
}