import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const VALID_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT']

export async function GET(req: NextRequest) {
  try {
    const session = await requireTenant(req)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const result = await pool.query(
      `SELECT * FROM "HelpdeskSLA" WHERE "organizationId" = $1 ORDER BY priority`,
      [session.organizationId]
    )
    return NextResponse.json({ slas: result.rows })
  } catch (err) {
    console.error('[helpdesk/sla GET]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireTenant(req)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { priority, firstResponseMinutes, resolutionMinutes, isActive } = body

    if (!VALID_PRIORITIES.includes(priority)) {
      return NextResponse.json({ error: 'Invalid priority' }, { status: 400 })
    }

    const crypto = require('crypto')
    const id = crypto.randomUUID()

    await pool.query(
      `INSERT INTO "HelpdeskSLA"
        (id, "organizationId", priority, "firstResponseMinutes", "resolutionMinutes", "isActive", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
       ON CONFLICT ("organizationId", priority) DO UPDATE
       SET "firstResponseMinutes" = $4, "resolutionMinutes" = $5, "isActive" = $6, "updatedAt" = NOW()`,
      [id, session.organizationId, priority, Number(firstResponseMinutes) || 60, Number(resolutionMinutes) || 1440, isActive !== false]
    )

    const result = await pool.query(
      `SELECT * FROM "HelpdeskSLA" WHERE "organizationId" = $1 AND priority = $2 LIMIT 1`,
      [session.organizationId, priority]
    )
    return NextResponse.json({ sla: result.rows[0] }, { status: 201 })
  } catch (err) {
    console.error('[helpdesk/sla POST]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}