export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const status = searchParams.get('status')
    const orgId = session.organizationId

    let sql = `SELECT * FROM "TrainingProgram" WHERE "organizationId" = $1`
    const params: any[] = [orgId]
    let idx = 2
    if (search) { sql += ` AND (title ILIKE $${idx} OR provider ILIKE $${idx} OR trainer ILIKE $${idx})`; params.push(`%${search}%`); idx++ }
    if (status && status !== 'ALL') { sql += ` AND status = $${idx++}`; params.push(status) }
    sql += ` ORDER BY "startDate" DESC NULLS LAST LIMIT 500`

    const res = await pool.query(sql, params)
    const trainings = res.rows.map(t => ({
      ...t,
      enrolledCount: Number(t.enrolledCount || 0),
      maxAttendees: Number(t.maxAttendees || 0),
      costPerAttendee: Number(t.costPerAttendee || 0),
      totalCost: Number(t.enrolledCount || 0) * Number(t.costPerAttendee || 0),
      fillRate: Number(t.maxAttendees || 0) > 0 ? Math.round((Number(t.enrolledCount || 0) / Number(t.maxAttendees)) * 100) : 0,
    }))

    const active = trainings.filter(t => t.status === 'IN_PROGRESS')
    const planned = trainings.filter(t => t.status === 'PLANNED')
    const completed = trainings.filter(t => t.status === 'COMPLETED')
    const totalEnrolled = trainings.reduce((s, t) => s + t.enrolledCount, 0)
    const totalCost = trainings.reduce((s, t) => s + t.totalCost, 0)

    const summary = {
      total: trainings.length,
      active: active.length,
      planned: planned.length,
      completed: completed.length,
      totalEnrolled,
      totalCost: Math.round(totalCost),
      avgCostPerProgram: trainings.length > 0 ? Math.round(totalCost / trainings.length) : 0,
    }

    return NextResponse.json({ trainings, summary })
  } catch (error) {
    console.error('Training GET error:', error)
    return NextResponse.json({ trainings: [], summary: {}, error: (error as Error).message })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const body = await request.json()
    if (!body.title || !body.title.trim()) return NextResponse.json({ error: 'Title required' }, { status: 400 })

    const crypto = require('crypto')
    const id = crypto.randomUUID()
    const result = await pool.query(
      `INSERT INTO "TrainingProgram"
        (id, title, category, provider, trainer, description, "startDate", "endDate", "durationHours",
         "costPerAttendee", "maxAttendees", "enrolledCount", status, "organizationId", "createdAt", "updatedAt")
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,NOW(),NOW())
       RETURNING *`,
      [
        id, body.title.trim(), body.category || null, body.provider || null, body.trainer || null,
        body.description || null, body.startDate || null, body.endDate || null,
        Number(body.durationHours || 0), Number(body.costPerAttendee || 0),
        Number(body.maxAttendees || 0), Number(body.enrolledCount || 0),
        body.status || 'PLANNED', session.organizationId,
      ]
    )
    return NextResponse.json({ training: result.rows[0] }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}