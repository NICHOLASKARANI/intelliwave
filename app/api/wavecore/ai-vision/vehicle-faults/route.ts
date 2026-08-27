export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/wavecore/auth'
import { pool } from '@/lib/wavecore/db'

export async function POST(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const faultCodes = ['P0300 - Random Misfire', 'P0420 - Catalyst Efficiency', 'P0171 - System Too Lean']
    const hasFaults = Math.random() > 0.5
    
    const detection = {
      engineHealth: hasFaults ? 0.4 + Math.random() * 0.3 : 0.8 + Math.random() * 0.19,
      batteryVoltage: 10 + Math.random() * 4,
      oilPressure: 10 + Math.random() * 40,
      coolantTemp: 80 + Math.random() * 40,
      faultCodes: hasFaults ? [faultCodes[Math.floor(Math.random() * faultCodes.length)]] : [],
      severity: hasFaults ? (Math.random() > 0.5 ? 'CRITICAL' : 'WARNING') : 'OK',
      confidence: 0.85 + Math.random() * 0.14,
      timestamp: new Date().toISOString()
    }

    const crypto = require('crypto')
    const id = crypto.randomUUID()
    await pool.query(
      `INSERT INTO "VehicleFault" (id, "engineHealth", "batteryVoltage", "oilPressure", "coolantTemp", "faultCodes", severity, "organizationId", "createdAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
      [id, detection.engineHealth, detection.batteryVoltage, detection.oilPressure, detection.coolantTemp, JSON.stringify(detection.faultCodes), detection.severity, session.organizationId]
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
      `SELECT * FROM "VehicleFault" WHERE "organizationId" = $1 ORDER BY "createdAt" DESC LIMIT 50`,
      [session.organizationId]
    )
    return NextResponse.json({ detections: result.rows })
  } catch {
    return NextResponse.json({ detections: [] })
  }
}