export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'
import { guardHR } from '@/lib/wavecore/guard'

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const guard = await guardHR(request, 'HR_READ')
    if (guard.deny) return guard.response!

    const orgId = session.organizationId
    const res = await pool.query(
      `SELECT * FROM "SLAPolicy" WHERE "organizationId" = $1 ORDER BY priority ASC, name ASC LIMIT 100`,
      [orgId]
    )
    const policies = res.rows

    const active = policies.filter(p => p.active)
    const summary = {
      total: policies.length,
      active: active.length,
      inactive: policies.length - active.length,
      byPriority: {
        LOW: policies.filter(p => p.priority === 'LOW').length,
        MEDIUM: policies.filter(p => p.priority === 'MEDIUM').length,
        HIGH: policies.filter(p => p.priority === 'HIGH').length,
        URGENT: policies.filter(p => p.priority === 'URGENT').length,
      },
      avgFirstResponseHours: policies.length > 0
        ? Math.round(policies.reduce((s, p) => s + Number(p.firstResponseHours || 0), 0) / policies.length * 10) / 10
        : 0,
      avgResolutionHours: policies.length > 0
        ? Math.round(policies.reduce((s, p) => s + Number(p.resolutionHours || 0), 0) / policies.length * 10) / 10
        : 0,
    }

    return NextResponse.json({ policies, summary })
  } catch (error) {
    console.error('SLA GET error:', error)
    return NextResponse.json({ policies: [], summary: {}, error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const guard = await guardHR(request, 'HR_WRITE')
    if (guard.deny) return guard.response!

    const body = await request.json()
    if (!body.name || !body.name.trim()) return NextResponse.json({ error: 'Name required' }, { status: 400 })

    const crypto = require('crypto')
    const id = crypto.randomUUID()

    const result = await pool.query(
      `INSERT INTO "SLAPolicy"
        (id, name, description, priority, "firstResponseHours", "resolutionHours", "businessHoursOnly", active, "organizationId", "createdAt", "updatedAt")
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,NOW(),NOW())
       RETURNING *`,
      [
        id, body.name.trim(), body.description || null,
        body.priority || 'MEDIUM',
        Number(body.firstResponseHours || 4),
        Number(body.resolutionHours || 24),
        body.businessHoursOnly !== false,
        body.active !== false,
        session.organizationId,
      ]
    )

    return NextResponse.json({ policy: result.rows[0] }, { status: 201 })
  } catch (error) {
    console.error('SLA POST error:', error)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}