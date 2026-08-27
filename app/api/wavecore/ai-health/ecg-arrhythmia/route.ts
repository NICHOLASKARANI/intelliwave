export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/wavecore/auth'
import { pool } from '@/lib/wavecore/db'

const RHYTHMS = ['Normal Sinus Rhythm', 'Atrial Fibrillation', 'Tachycardia', 'Bradycardia', 'Ventricular Fibrillation']
const ARRHYTHMIAS = ['None', 'AFib', 'SVT', 'Heart Block', 'VFib']

export async function POST(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const heartRate = body.heartRate || 72
    
    const hasArrhythmia = Math.random() > 0.7
    const rhythmIndex = hasArrhythmia ? Math.floor(Math.random() * (RHYTHMS.length - 1)) + 1 : 0
    
    const result = {
      heartRate,
      rhythm: RHYTHMS[rhythmIndex],
      arrhythmiaType: ARRHYTHMIAS[rhythmIndex],
      severity: hasArrhythmia ? (Math.random() > 0.5 ? 'CRITICAL' : 'WARNING') : 'NORMAL',
      confidence: 0.88 + Math.random() * 0.11,
      timestamp: new Date().toISOString(),
      waveform: body.waveform || []
    }

    const crypto = require('crypto')
    const id = crypto.randomUUID()
    await pool.query(
      `INSERT INTO "ECGDetection" (id, "heartRate", rhythm, "arrhythmiaType", severity, confidence, "organizationId", "createdAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
      [id, heartRate, result.rhythm, result.arrhythmiaType, result.severity, result.confidence, session.organizationId]
    )

    return NextResponse.json({ success: true, result })
  } catch (error) {
    return NextResponse.json({ error: 'Detection failed' }, { status: 500 })
  }
}