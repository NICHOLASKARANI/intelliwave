export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import crypto from 'crypto'

export async function POST(req: NextRequest) {
  try {
    const leaderId = req.cookies.get('executive_session')?.value
    if (!leaderId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { title, target_audience, implementation_plan, expected_customers, evidence_url } = body

    if (!title || !target_audience || !implementation_plan) {
      return NextResponse.json({ error: 'Title, audience, and plan required' }, { status: 400 })
    }

    const id = crypto.randomUUID()
    await pool.query(
      `INSERT INTO "ExecutiveIdea" (id, leader_id, title, target_audience, implementation_plan, expected_customers, evidence_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [id, leaderId, title, target_audience, implementation_plan, parseInt(expected_customers) || 0, evidence_url || null]
    )

    return NextResponse.json({ success: true, id }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Submit failed' }, { status: 500 })
  }
}