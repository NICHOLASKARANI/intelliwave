export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/wavecore/auth'
import { pool } from '@/lib/wavecore/db'

export async function POST(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const data = {
      temperature: 20 + Math.random() * 20,
      humidity: 30 + Math.random() * 50,
      soilMoisture: 20 + Math.random() * 70,
      lightLevel: 200 + Math.random() * 800,
      co2Level: 300 + Math.random() * 1200,
      airflow: Math.random() * 10,
      plantHealth: Math.floor(50 + Math.random() * 50),
      irrigationNeeded: Math.random() > 0.8,
      ventilationNeeded: Math.random() > 0.75,
      timestamp: new Date().toISOString()
    }

    const crypto = require('crypto')
    const id = crypto.randomUUID()
    await pool.query(
      `INSERT INTO "GreenhouseData" (id, temperature, humidity, "soilMoisture", "lightLevel", "co2Level", "plantHealth", "organizationId", "createdAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
      [id, data.temperature, data.humidity, data.soilMoisture, data.lightLevel, data.co2Level, data.plantHealth, session.organizationId]
    )

    return NextResponse.json({ success: true, data })
  } catch (error) {
    return NextResponse.json({ error: 'Monitoring failed' }, { status: 500 })
  }
}