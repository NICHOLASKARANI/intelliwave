export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

// GET: List execution logs
export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const result = await pool.query(
      `SELECT * FROM "ExecutionLog" WHERE "organizationId" = $1 ORDER BY "createdAt" DESC LIMIT 100`,
      [session!.organizationId]
    )

    return NextResponse.json({ logs: result.rows })
  } catch (error) {
    return NextResponse.json({ logs: [] })
  }
}

// POST: Create log entry
export async function POST(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const crypto = require('crypto')
    const id = crypto.randomUUID()

    const result = await pool.query(
      `INSERT INTO "ExecutionLog" (id, "workflowId", "workflowName", status, duration, "organizationId", "createdAt")
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       RETURNING *`,
      [id, body.workflowId, body.workflowName, body.status || 'SUCCESS', body.duration || '0s', session!.organizationId]
    )

    return NextResponse.json({ log: result.rows[0] }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed: ' + (error as Error).message }, { status: 500 })
  }
}

// DELETE: Clear all logs for tenant
export async function DELETE(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await pool.query(`DELETE FROM "ExecutionLog" WHERE "organizationId" = $1`, [session!.organizationId])

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed: ' + (error as Error).message }, { status: 500 })
  }
}